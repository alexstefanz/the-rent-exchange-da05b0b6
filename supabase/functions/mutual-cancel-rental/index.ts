import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Finalizes a mutually-approved rental cancellation.
 * Pre-condition: rentals.cancel_request_status = 'approved' (set by RPC respond_mutual_cancellation).
 * Voids the Stripe hold (or full refund if already captured), marks rental cancelled
 * with full refund to renter (incl. platform fee), inserts a refund transaction record
 * and notifies both parties.
 */
serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const STRIPE_LIVE = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const STRIPE_TEST = Deno.env.get("STRIPE_TEST_SECRET_KEY") || "";

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const rentalId = typeof body?.rental_id === "string" ? body.rental_id : "";
    if (!rentalId) {
      return new Response(JSON.stringify({ error: "missing_rental_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, status, payment_status, payment_intent_id, subtotal, platform_fee, is_test_payment, cancel_request_status, cancel_request_reason")
      .eq("id", rentalId)
      .maybeSingle();
    if (rErr || !rental) {
      return new Response(JSON.stringify({ error: "rental_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Allow renter, owner, or admin
    let isAdmin = false;
    if (rental.renter_id !== userId && rental.owner_id !== userId) {
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roleRow;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    if (rental.cancel_request_status !== "approved") {
      return new Response(JSON.stringify({ error: "not_approved" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rental.status === "cancelled") {
      return new Response(JSON.stringify({ ok: true, already: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let newPaymentStatus = rental.payment_status;
    if (rental.payment_intent_id) {
      const stripeKey = rental.is_test_payment ? STRIPE_TEST : STRIPE_LIVE;
      if (!stripeKey) {
        return new Response(JSON.stringify({ error: "stripe_key_missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      try {
        const pi = await stripe.paymentIntents.retrieve(rental.payment_intent_id);
        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.cancel(rental.payment_intent_id, { cancellation_reason: "requested_by_customer" });
          newPaymentStatus = "voided";
        } else if (pi.status === "succeeded") {
          await stripe.refunds.create({ payment_intent: rental.payment_intent_id, reason: "requested_by_customer" });
          newPaymentStatus = "refunded";
        } else {
          newPaymentStatus = "voided";
        }
      } catch (e) {
        console.error("[mutual-cancel-rental] stripe error", e);
        return new Response(JSON.stringify({ error: "stripe_failure", message: "Payment provider error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const now = new Date().toISOString();
    const reason = `Anulare aprobată mutual: ${rental.cancel_request_reason || ""}`.trim();
    await admin.from("rentals").update({
      status: "cancelled",
      payment_status: newPaymentStatus,
      cancelled_at: now,
      rejection_reason: reason,
    }).eq("id", rentalId);

    if (!rental.is_test_payment) {
      await admin.from("transactions").insert({
        rental_id: rentalId,
        user_id: rental.renter_id,
        type: "refund",
        amount: Number(rental.subtotal || 0) + Number(rental.platform_fee || 0),
        status: "completed",
        processed_at: now,
        description: `Refund anulare mutuală - rental ${rentalId}`,
      });
    }

    // Notify both parties (best-effort)
    admin.functions.invoke("notify-rental-event", {
      body: { rental_id: rentalId, event_key: "mutual_cancel_approved", actor_id: userId },
    }).catch((e) => console.warn("notify mutual_cancel_approved failed", e));

    return new Response(JSON.stringify({ ok: true, payment_status: newPaymentStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mutual-cancel-rental error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}, "POST, OPTIONS"));