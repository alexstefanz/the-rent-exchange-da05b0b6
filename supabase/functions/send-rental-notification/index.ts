import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const { rental_id } = await req.json();

    // Rate limit: 5 per minute per rental
    if (!checkRateLimit(`rental:${rental_id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
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

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("title")
      .eq("id", rental.product_id)
      .maybeSingle();

    // Insert transaction (status reflects the Stripe authorization hold).
    {
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("rental_id", rental.id)
        .eq("type", "rental_payment")
        .limit(1)
        .maybeSingle();

      if (!existingTx) {
        await supabaseAdmin.from("transactions").insert({
          rental_id: rental.id,
          user_id: rental.renter_id,
          amount: Number(rental.subtotal || 0) + Number(rental.platform_fee || 0),
          type: "rental_payment",
          status: "authorized",
          description: `Plată închiriere: ${product?.title || "Produs"}`,
          currency: "RON",
        });
      }
    }

    // Resolve (or create) the rental conversation up-front so chat is ready when the owner clicks the notification.
    try {
      const { data: convId, error: convErr } = await supabaseAdmin.rpc(
        "get_or_create_rental_conversation",
        { p_rental_id: rental.id }
      );
      if (convErr) {
        console.error("[send-rental-notification] get_or_create_rental_conversation error:", convErr);
      }
    } catch (e) {
      console.error("[send-rental-notification] conversation RPC threw:", e);
    }

    // Note: in-app notifications, branded emails and SMS for request_created
    // are sent by `notify-rental-event` (event_key: "request_created").
    // We do NOT duplicate them here — the previous wording incorrectly said
    // "Plată primită" while at this point the payment is only AUTHORIZED
    // (Stripe hold). Capture happens after the owner accepts the request.

    return new Response(JSON.stringify({ success: true }), {
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
