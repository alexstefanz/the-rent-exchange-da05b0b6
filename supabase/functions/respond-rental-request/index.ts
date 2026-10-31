import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 10, windowSec = 60): boolean {
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

const PLATFORM_URL = "https://rentli.ro";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rental_id, action, reason } = await req.json();

    if (!rental_id || !["accept", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "rental_id and action (accept/reject) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 10 requests per minute per user
    if (!checkRateLimit(`respond:${user.id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rental, error: rentalError } = await supabaseAdmin
      .from("rentals")
      .select("*")
      .eq("id", rental_id)
      .single();

    if (rentalError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not the owner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.status !== "pending") {
      return new Response(JSON.stringify({ error: "Rental is not pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accept") {
      const { data: prof } = await supabaseAdmin
        .from("profiles").select("identity_status").eq("id", user.id).maybeSingle();
      if (prof?.identity_status !== "verified") {
        return new Response(JSON.stringify({
          error: "KYC_REQUIRED: Verifică-ți identitatea pentru a accepta prima închiriere.",
          code: "KYC_REQUIRED",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const newStatus = action === "accept" ? "confirmed" : "cancelled";
    const updateData: Record<string, unknown> = { status: newStatus };
    if (action === "accept") {
      updateData.confirmed_at = new Date().toISOString();
    } else {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason || "Refuzat de proprietar";
      updateData.rejection_reason = reason || "Refuzat de proprietar";
      updateData.cancelled_by = user.id;
      // Mark refund as pending; the actual Stripe call runs in background below.
      if (rental.payment_intent_id) {
        updateData.payment_status = "refund_pending";
      }
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("rentals")
      .update(updateData)
      .eq("id", rental_id)
      .select("id, status, payment_status")
      .maybeSingle();
    if (updateErr) {
      console.error("[respond-rental-request] rental update failed:", updateErr);
      return new Response(
        JSON.stringify({ error: updateErr.message || "Rental update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!updated || updated.status !== newStatus) {
      console.error("[respond-rental-request] rental status did not change", { rental_id, newStatus, updated });
      return new Response(
        JSON.stringify({ error: "Rental status was not updated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert in-app notification + transactions update synchronously (fast, single-table writes)
    if (action === "accept") {
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost acceptată! Plătește acum 💳",
        title_en: "Your request was accepted! Pay now 💳",
        description_ro: `Cererea ta a fost acceptată. Plătește acum pentru a confirma rezervarea.`,
        description_en: `Your request was accepted. Pay now to confirm the booking.`,
        link: rental.public_id ? `/rezervari/${rental.public_id}` : "/rezervari",
      });
      await supabaseAdmin
        .from("transactions")
        .update({ status: "confirmed" })
        .eq("rental_id", rental_id)
        .eq("status", "pending");
    } else {
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost refuzată",
        title_en: "Your request was declined",
        description_ro: `Cererea ta a fost refuzată.${reason ? ` Motiv: ${reason}` : ""}`,
        description_en: `Your request was declined.${reason ? ` Reason: ${reason}` : ""}`,
        link: `/rezervari`,
      });
    }

    // Background: emails, Stripe refund, notify-rental-event (SMS + push).
    // These should not block the popup response.
    const runBackground = async () => {
      try {
        // Stripe refund/cancel on reject
        if (action === "reject" && rental.payment_intent_id) {
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKey) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
              if (rental.payment_status === "captured") {
                await stripe.refunds.create({ payment_intent: rental.payment_intent_id });
              } else {
                await stripe.paymentIntents.cancel(rental.payment_intent_id).catch(async (e) => {
                  if (String(e?.message || "").includes("cannot be canceled")) {
                    await stripe.refunds.create({ payment_intent: rental.payment_intent_id });
                  } else { throw e; }
                });
              }
              await supabaseAdmin
                .from("rentals")
                .update({ payment_status: "refunded", refunded_at: new Date().toISOString() })
                .eq("id", rental_id);
            } catch (e) {
              console.error("[bg] Stripe refund/cancel error:", e);
            }
          }
        }

        // Branded emails + in-app + SMS are all sent by notify-rental-event
        // (single source of truth — prevents duplicate emails).
        await supabaseAdmin.functions.invoke("notify-rental-event", {
          body: {
            rental_id: rental.id,
            event_key: action === "accept" ? "request_accepted" : "request_rejected",
            actor_id: user.id,
          },
        }).catch((e) => console.error("[bg] notify-rental-event failed:", e));
      } catch (e) {
        console.error("[bg] respond-rental-request background error:", e);
      }
    };

    // @ts-ignore — EdgeRuntime is provided by Supabase Edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runBackground());
    } else {
      // Fallback for local: fire and forget
      runBackground();
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
