import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { requireServiceCaller, unauthorizedResponse } from "../_shared/authGuard.ts";
// Cron-invoked: notifies both parties ~12h before agreed pickup time.
// Idempotent via rentals.pickup_reminder_sent_at.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(withCors(async (req) => {
  // Cron/internal only: service-role key required.
  if (!(await requireServiceCaller(req))) return unauthorizedResponse({ "Content-Type": "application/json" });
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const now = Date.now();
    const lower = new Date(now + 11.5 * 60 * 60 * 1000).toISOString(); // 11h30m
    const upper = new Date(now + 12.5 * 60 * 60 * 1000).toISOString(); // 12h30m

    const { data: rentals, error } = await supabase
      .from("rentals")
      .select(
        "id, owner_id, renter_id, pickup_agreed_at, pickup_location, products(title)",
      )
      .is("pickup_reminder_sent_at", null)
      .is("handover_confirmed_at", null)
      .gte("pickup_agreed_at", lower)
      .lte("pickup_agreed_at", upper);

    if (error) throw error;

    let sent = 0;
    for (const r of rentals ?? []) {
      // Delegate to the orchestrator → handles in-app + email + SMS for both parties.
      const { error: invokeErr } = await supabase.functions.invoke("notify-rental-event", {
        body: { rental_id: r.id, event_key: "pv_pickup_pending" },
      });
      if (invokeErr) {
        console.error("notify-rental-event failed", r.id, invokeErr.message);
        continue;
      }

      const { error: markErr } = await supabase
        .from("rentals")
        .update({ pickup_reminder_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      if (markErr) {
        console.error("rental mark failed", r.id, markErr.message);
        continue;
      }
      sent += 1;
    }

    return new Response(
      JSON.stringify({ ok: true, candidates: rentals?.length ?? 0, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-pickup-reminders error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}, "POST, OPTIONS"));