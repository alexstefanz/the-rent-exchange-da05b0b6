import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { computeCancellation } from "../_shared/cancellationPolicy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
 *  - >=24h before start  => void hold => 100% refund
 *  - <24h, before start  => capture first day for owner, refund the rest (platform fee retained)
 *  - after start         => no refund (must capture full and let lifecycle continue)
 *  - after handover/captured => no refund
 */
serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const STRIPE_LIVE_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    const STRIPE_TEST_KEY = Deno.env.get("STRIPE_TEST_SECRET_KEY") || "";

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

    // Load rental + product
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, product_id, status, payment_status, payment_intent_id, subtotal, daily_price, platform_fee, start_date, end_date, handover_confirmed_at, is_test_payment, products(title)")
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
    const stripe = new Stripe(
      rental.is_test_payment ? (STRIPE_TEST_KEY || STRIPE_LIVE_KEY) : STRIPE_LIVE_KEY,
      { apiVersion: "2025-08-27.basil" },
    );
    if (rental.status === "cancelled" || rental.status === "completed") {
      return new Response(JSON.stringify({ error: "rental_not_cancellable", status: rental.status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.handover_confirmed_at) {
      return new Response(JSON.stringify({
        error: "HANDOVER_DONE_USE_EARLY_RETURN",
        message: "Rezervarea a fost predată. Folosește returnarea anticipată sau deschide o dispută.",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decide refund tier from shared policy
    const outcome = computeCancellation({
      startDate: rental.start_date as string,
      subtotal: Number(rental.subtotal),
      dailyPrice: Number(rental.daily_price),
      platformFee: Number(rental.platform_fee || 0),
      handoverConfirmedAt: rental.handover_confirmed_at as string | null,
    });
    const tier = outcome.tier;
    const refundedAmount = outcome.refundAmount;
    const ownerCompensation = outcome.ownerCompensation;
    const subtotal = Number(rental.subtotal);

    // Apply Stripe action
    let stripeAction = "none";
    let stripeError: string | null = null;
    if (rental.payment_intent_id) {
      try {
        if (tier === "FREE") {
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
        } else if (tier === "LIMITED") {
          const captureMinor = Math.round(ownerCompensation * 100);
          const pi = await stripe.paymentIntents.retrieve(rental.payment_intent_id);
          if (pi.status === "requires_capture") {
            if (captureMinor <= 0) {
              await stripe.paymentIntents.cancel(rental.payment_intent_id);
              stripeAction = "cancelled_hold";
            } else {
              // Capture only the owner compensation; Stripe voids the rest of the hold
              await stripe.paymentIntents.capture(rental.payment_intent_id, {
                amount_to_capture: captureMinor,
              });
              stripeAction = `partial_capture_${captureMinor}`;
            }
          } else if (pi.status === "succeeded") {
            // Already captured fully — issue partial refund of refundedAmount
            const refundMinor = Math.round(refundedAmount * 100);
            if (refundMinor > 0) {
              await stripe.refunds.create({
                payment_intent: rental.payment_intent_id,
                amount: refundMinor,
                reason: "requested_by_customer",
              });
              stripeAction = `partial_refund_${refundMinor}`;
            } else {
              stripeAction = "no_refund_due";
            }
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
      cancellation_tier: tier,
      cancelled_by: "renter",
      refund_amount: refundedAmount,
      owner_compensation: ownerCompensation,
    };
    if (tier === "FREE") {
      updates.payment_status = "refunded";
      updates.refunded_at = new Date().toISOString();
    } else if (tier === "LIMITED") {
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

    // If Stripe action failed (or unknown PI state), open admin ticket as a safety net.
    // Skip ticket creation entirely when there is no payment intent (test rentals / no funds to move).
    if (stripeError || (rental.payment_intent_id && stripeAction === "none")) {
      // Idempotency: reuse an existing active automatic cancellation ticket if any.
      const { data: existing } = await admin
        .from("ops_tickets")
        .select("id, public_id")
        .eq("reservation_id", rental.id)
        .eq("requester_user_id", userId)
        .eq("category_type", "REFUND_REQUEST")
        .contains("tags", ["renter-cancel"])
        .in("status", ["NEW", "OPEN", "IN_PROGRESS"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        // Append an internal note instead of creating a duplicate.
        await admin.from("ops_ticket_messages").insert({
          ticket_id: existing.id,
          author_type: "SYSTEM",
          author_id: null,
          is_internal: true,
          message_text:
            `Anulare repetată pentru aceeași rezervare. Tier=${tier}, stripe_action=${stripeAction}` +
            (stripeError ? `, stripe_error=${stripeError}` : "") + ".",
        });
      } else {
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

      const { data: ticket, error: tInsErr } = await admin
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

      if (tInsErr) {
        // Likely the unique partial index caught a race; ignore silently.
        console.warn("ops_tickets insert skipped (likely duplicate):", tInsErr.message);
      }
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
    }

    // Notify both parties via the orchestrator (non-blocking)
    admin.functions
      .invoke("notify-rental-event", {
        body: {
          rental_id: rentalId,
          event_key: "cancellation_confirmed",
          actor_id: userId,
          extra: { tier, refundAmount: refundedAmount, ownerCompensation },
        },
      })
      .catch((e) => console.error("notify cancellation_confirmed error:", e));

    return new Response(
      JSON.stringify({
        ok: true,
        tier,
        refunded_amount: refundedAmount,
        owner_compensation: ownerCompensation,
        stripe_action: stripeAction,
        stripe_error: stripeError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("cancel-rental-by-renter error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));