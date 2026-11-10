import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

/**
 * Direct cancellation of a PAID rental before any contract signature.
 * Refunds automatically: Stripe hold voided / payment refunded; wallet credit is
 * released by the release_wallet_credit_on_cancel trigger.
 */
serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthenticated" }, 401);
    const userClient = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "unauthenticated" }, 401);
    const uid = u.user.id;

    const { rental_id } = await req.json().catch(() => ({}));
    if (typeof rental_id !== "string") return json({ error: "missing_rental_id" }, 400);

    const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: r } = await admin.from("rentals")
      .select("id, renter_id, owner_id, status, payment_status, payment_intent_id, subtotal, platform_fee, stripe_fee, wallet_credit_applied, is_test_payment, handover_confirmed_at")
      .eq("id", rental_id).maybeSingle();
    if (!r) return json({ error: "rental_not_found" }, 404);

    let actor: "renter" | "owner" | "admin";
    if (r.renter_id === uid) actor = "renter";
    else if (r.owner_id === uid) actor = "owner";
    else {
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      if (!role) return json({ error: "forbidden" }, 403);
      actor = "admin";
    }
    if (r.status === "cancelled") return json({ ok: true, already: true });
    if (!["pending", "confirmed"].includes(r.status)) return json({ error: "invalid_status" }, 400);
    if (r.handover_confirmed_at) return json({ error: "handover_signed" }, 400);

    const { count } = await admin.from("rental_contract_acceptances").select("id", { count: "exact", head: true }).eq("rental_id", rental_id);
    if ((count ?? 0) > 0) return json({ error: "contract_signed" }, 400);

    let paymentStatus = r.payment_status;
    if (r.payment_intent_id) {
      const key = r.is_test_payment ? Deno.env.get("STRIPE_TEST_SECRET_KEY") : Deno.env.get("STRIPE_SECRET_KEY");
      if (!key) return json({ error: "stripe_key_missing" }, 500);
      const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
      try {
        const pi = await stripe.paymentIntents.retrieve(r.payment_intent_id);
        if (pi.status === "requires_capture") { await stripe.paymentIntents.cancel(pi.id, { cancellation_reason: "requested_by_customer" }); paymentStatus = "voided"; }
        else if (pi.status === "succeeded") { await stripe.refunds.create({ payment_intent: pi.id, reason: "requested_by_customer" }); paymentStatus = "refunded"; }
        else paymentStatus = "voided";
      } catch (e) {
        console.error("stripe error", e);
        return json({ error: "stripe_failure" }, 502);
      }
    } else if (Number(r.wallet_credit_applied || 0) > 0) {
      paymentStatus = "refunded";
    }

    const total = Number(r.subtotal || 0) + Number(r.platform_fee || 0) + Number(r.stripe_fee || 0);
    const now = new Date().toISOString();
    const { error: upErr } = await admin.from("rentals").update({
      status: "cancelled",
      payment_status: paymentStatus,
      cancelled_at: now,
      refunded_at: now,
      refund_amount: total,
      cancelled_by: uid,
      cancellation_reason: `${actor}_paid_before_contract`,
      renter_seen_confirmation: actor === "renter",
      cancel_request_status: null,
      cancel_request_initiator: null,
      cancel_request_subject: null,
      cancel_request_reason: null,
    }).eq("id", rental_id);
    if (upErr) { console.error(upErr); return json({ error: "update_failed" }, 500); }

    if (!r.is_test_payment) {
      await admin.from("transactions").insert({
        rental_id, user_id: r.renter_id, type: "refund", amount: total, status: "completed",
        processed_at: now, description: `Rambursare anulare înainte de contract - ${rental_id}`,
      });
    }

    admin.functions.invoke("notify-rental-event", {
      body: { rental_id, event_key: actor === "owner" ? "request_cancelled_by_owner" : "request_cancelled_by_renter", actor_id: uid },
    }).catch(() => {});

    return json({ ok: true, actor, payment_status: paymentStatus, refund: total, to_wallet: !r.payment_intent_id });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
}, "POST, OPTIONS"));
