import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 5, windowSec = 60): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

/**
 * Renter-initiated cancellation with automatic refund tier:
 *  - >=48h before start  => void hold => 100% refund
 *  - <48h, before start  => capture 50% => owner gets half, renter refunded 50%
 *  - after start         => no refund (must capture full and let lifecycle continue)
 *  - after handover/captured => no refund
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    if (!checkRateLimit(`renter-cancel:${userId}`, 5, 60)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = typeof body?.rental_id === "string" ? body.rental_id : "";
    if (!rentalId) {
      return new Response(JSON.stringify({ error: "missing_rental_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-08-27.basil" });

    // Load rental + product
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, product_id, status, payment_status, payment_intent_id, subtotal, start_date, end_date, handover_confirmed_at, products(title)")
      .eq("id", rentalId)
      .maybeSingle();
    if (rErr || !rental) {
      return new Response(JSON.stringify({ error: "rental_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.renter_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.status === "cancelled" || rental.status === "completed") {
      return new Response(JSON.stringify({ error: "rental_not_cancellable", status: rental.status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.handover_confirmed_at) {
      return new Response(JSON.stringify({ error: "already_handed_over" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute hours until start
    const now = new Date();
    const start = new Date(`${rental.start_date}T00:00:00`);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Decide refund tier
    // Tier "FULL_REFUND": >=48h before start, hold not yet captured
    // Tier "PARTIAL_50":  0 <= hoursUntilStart < 48, hold not yet captured
    // Tier "NO_REFUND":   hoursUntilStart < 0 (after start) or already paid/captured
    let tier: "FULL_REFUND" | "PARTIAL_50" | "NO_REFUND";
    if (rental.payment_status === "paid") {
      tier = "NO_REFUND";
    } else if (hoursUntilStart >= 48) {
      tier = "FULL_REFUND";
    } else if (hoursUntilStart >= 0) {
      tier = "PARTIAL_50";
    } else {
      tier = "NO_REFUND";
    }

    const subtotal = Number(rental.subtotal); // RON
    const subtotalMinor = Math.round(subtotal * 100); // bani
    const partialMinor = Math.round(subtotalMinor * 0.5);
    const refundedAmount = tier === "FULL_REFUND" ? subtotal : tier === "PARTIAL_50" ? subtotal / 2 : 0;

    // Apply Stripe action
    let stripeAction = "none";
    let stripeError: string | null = null;
    if (rental.payment_intent_id) {
      try {
        if (tier === "FULL_REFUND") {
          const pi = await stripe.paymentIntents.retrieve(rental.payment_intent_id);
          if (pi.status === "requires_capture") {
            await stripe.paymentIntents.cancel(rental.payment_intent_id);
            stripeAction = "cancelled_hold";
          } else if (pi.status === "succeeded") {
            await stripe.refunds.create({
              payment_intent: rental.payment_intent_id,
              reason: "requested_by_customer",
            });
            stripeAction = "full_refund";
          }
        } else if (tier === "PARTIAL_50") {
          const pi = await stripe.paymentIntents.retrieve(rental.payment_intent_id);
          if (pi.status === "requires_capture") {
            // Capture 50% — Stripe automatically voids the rest of the hold
            await stripe.paymentIntents.capture(rental.payment_intent_id, {
              amount_to_capture: partialMinor,
            });
            stripeAction = "partial_capture_50";
          } else if (pi.status === "succeeded") {
            // Already captured fully — issue partial refund of 50%
            await stripe.refunds.create({
              payment_intent: rental.payment_intent_id,
              amount: partialMinor,
              reason: "requested_by_customer",
            });
            stripeAction = "partial_refund_50";
          }
        }
      } catch (e) {
        stripeError = (e as Error).message;
        console.error("Stripe action failed:", stripeError);
      }
    }

    // Update rental row
    const updates: Record<string, unknown> = {
      status: "cancelled",
      cancellation_reason: `renter_cancelled_${tier.toLowerCase()}`,
      cancelled_at: new Date().toISOString(),
    };
    if (tier === "FULL_REFUND") {
      updates.payment_status = "refunded";
      updates.refunded_at = new Date().toISOString();
    } else if (tier === "PARTIAL_50") {
      updates.payment_status = "partially_refunded";
      updates.refunded_at = new Date().toISOString();
    }

    const { error: uErr } = await admin
      .from("rentals")
      .update(updates)
      .eq("id", rentalId);
    if (uErr) {
      console.error("Update rental error:", uErr);
    }

    // If Stripe action failed (or unknown PI state), open admin ticket as a safety net
    if (stripeError || stripeAction === "none") {
      const productTitle = (rental as any).products?.title || "Produs";
      const description =
        `Anulare automată a eșuat sau necesită intervenție manuală.\n\n` +
        `• Rental ID: ${rental.id}\n` +
        `• Payment Intent: ${rental.payment_intent_id || "—"}\n` +
        `• Tier: ${tier}\n` +
        `• Sumă rambursare așteptată: ${refundedAmount} RON\n` +
        `• Subtotal: ${subtotal} RON\n` +
        `• Perioadă: ${rental.start_date} → ${rental.end_date}\n` +
        `• Stripe action: ${stripeAction}\n` +
        (stripeError ? `• Stripe error: ${stripeError}\n` : "");

      const { data: ticket } = await admin
        .from("ops_tickets")
        .insert({
          title: `Anulare chiriaș — verificare manuală (${productTitle})`,
          description,
          category_group: "PAYMENTS",
          category_type: "REFUND_REQUEST",
          priority: "HIGH",
          status: "NEW",
          requester_user_id: userId,
          rental_user_id: userId,
          owner_user_id: rental.owner_id,
          product_id: rental.product_id,
          reservation_id: rental.id,
          created_by: userId,
          tags: ["renter-cancel", "stripe-fallback", tier.toLowerCase()],
        })
        .select("id")
        .single();

      if (ticket) {
        const stripeLink = rental.payment_intent_id
          ? `https://dashboard.stripe.com/payments/${rental.payment_intent_id}`
          : "(payment intent indisponibil)";
        await admin.from("ops_ticket_messages").insert({
          ticket_id: ticket.id,
          author_type: "SYSTEM",
          author_id: null,
          is_internal: true,
          message_text: `Acțiune necesară pe ${stripeLink}. Tier așteptat: ${tier} (${refundedAmount} RON refund).`,
        });
      }
    }

    // Notify owner (non-blocking)
    admin.functions
      .invoke("send-cancellation-notification", { body: { rental_id: rentalId } })
      .catch((e) => console.error("send-cancellation-notification error:", e));

    return new Response(
      JSON.stringify({
        ok: true,
        tier,
        refunded_amount: refundedAmount,
        stripe_action: stripeAction,
        stripe_error: stripeError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("cancel-rental-by-renter error", e);
    return new Response(JSON.stringify({ error: "internal_error", detail: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});