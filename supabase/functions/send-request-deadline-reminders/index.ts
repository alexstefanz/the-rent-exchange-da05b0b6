import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { requireServiceCaller, unauthorizedResponse } from "../_shared/authGuard.ts";
// Cron-invoked (every 15 min): for rentals stuck in `pending`:
//   - at 22h since created_at → send `request_reminder_2h` (in_app + email + SMS) to owner + renter
//   - at 24h since created_at → auto-cancel + release Stripe hold + send `request_expired`
// Idempotent via notification_audit_log (event_key); auto-expire is guarded by status='pending'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(withCors(async (req) => {
  // Cron/internal only: service-role key required.
  if (!(await requireServiceCaller(req))) return unauthorizedResponse({ "Content-Type": "application/json" });
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

  const summary: Record<string, unknown> = { dryRun, remindersSent: 0, expired: 0, errors: [] as string[] };

  try {
    const nowIso = new Date().toISOString();
    const t46 = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString();
    const t48 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // ============== A) REMINDERS at 22–24h ==============
    const { data: reminderRentals, error: rErr } = await supabase
      .from("rentals")
      .select("id")
      .eq("status", "pending")
      .lte("created_at", t46)
      .gt("created_at", t48);
    if (rErr) throw rErr;

    for (const r of reminderRentals ?? []) {
      const { data: already } = await supabase
        .from("notification_audit_log")
        .select("id")
        .eq("rental_id", r.id)
        .eq("event_key", "request_reminder_2h")
        .in("status", ["sent", "delivered"])
        .limit(1)
        .maybeSingle();
      if (already) continue;

      if (dryRun) { summary.remindersSent = (summary.remindersSent as number) + 1; continue; }

      const { error: invokeErr } = await supabase.functions.invoke("notify-rental-event", {
        body: { rental_id: r.id, event_key: "request_reminder_2h" },
      });
      if (invokeErr) {
        console.error("reminder failed", r.id, invokeErr.message);
        (summary.errors as string[]).push(`reminder ${r.id}: ${invokeErr.message}`);
        continue;
      }
      summary.remindersSent = (summary.remindersSent as number) + 1;
    }

    // ============== B) AUTO-EXPIRE at 24h+ ==============
    const { data: expiredRentals, error: eErr } = await supabase
      .from("rentals")
      .select("id, payment_intent_id, payment_status")
      .eq("status", "pending")
      .lte("created_at", t48);
    if (eErr) throw eErr;

    for (const r of expiredRentals ?? []) {
      if (dryRun) { summary.expired = (summary.expired as number) + 1; continue; }

      // 1. Mark cancelled
      const updateData: Record<string, unknown> = {
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: "Cerere expirată automat (24h fără răspuns proprietar)",
        rejection_reason: "Cerere expirată automat",
      };
      if (r.payment_intent_id) updateData.payment_status = "refund_pending";

      const { error: upErr } = await supabase
        .from("rentals")
        .update(updateData)
        .eq("id", r.id)
        .eq("status", "pending"); // race-safe
      if (upErr) {
        (summary.errors as string[]).push(`update ${r.id}: ${upErr.message}`);
        continue;
      }

      // 2. Cancel transactions still pending
      await supabase
        .from("transactions")
        .update({ status: "cancelled" })
        .eq("rental_id", r.id)
        .eq("status", "pending");

      // 3. Stripe: release the hold
      if (r.payment_intent_id && stripe) {
        try {
          if (r.payment_status === "captured") {
            await stripe.refunds.create({ payment_intent: r.payment_intent_id });
          } else {
            await stripe.paymentIntents.cancel(r.payment_intent_id).catch(async (e: any) => {
              if (String(e?.message || "").includes("cannot be canceled")) {
                await stripe.refunds.create({ payment_intent: r.payment_intent_id! });
              } else { throw e; }
            });
          }
          await supabase
            .from("rentals")
            .update({ payment_status: "refunded", refunded_at: nowIso })
            .eq("id", r.id);
        } catch (e) {
          console.error("[expire] Stripe error", r.id, e);
          (summary.errors as string[]).push(`stripe ${r.id}: ${(e as Error).message}`);
        }
      }

      // 4. Notify both parties
      const { error: nErr } = await supabase.functions.invoke("notify-rental-event", {
        body: { rental_id: r.id, event_key: "request_expired" },
      });
      if (nErr) (summary.errors as string[]).push(`notify-expired ${r.id}: ${nErr.message}`);

      summary.expired = (summary.expired as number) + 1;
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-request-deadline-reminders error", e);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error", ...summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}, "GET, POST, OPTIONS"));