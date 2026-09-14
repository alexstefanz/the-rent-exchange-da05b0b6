import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_HOLD_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client: carries the JWT so RLS allows reading own profile
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = authData.user;

    // Parse body
    const { rental_id, message_to_owner, platform } = await req.json();
    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch rental with product info using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rental, error: rentalError } = await supabaseAdmin
      .from("rentals")
      .select("*, products:product_id(title, images, slug)")
      .eq("id", rental_id)
      .eq("renter_id", user.id)
      .single();

    if (rentalError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.payment_status === "paid" || rental.payment_status === "authorized") {
      return new Response(JSON.stringify({ error: "Already paid or authorized" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stripe RON minimum charge is 2 RON. Block lower amounts up-front so we
    // surface a friendly error instead of a generic 500 from Stripe.
    // NEW MODEL: the client total = subtotal (owner-net) + platform_fee.
    const subtotalRon = Number(rental.subtotal) || 0;
    const platformFeeRon = Number(rental.platform_fee) || 0;
    const clientTotalRon = Math.round((subtotalRon + platformFeeRon) * 100) / 100;
    if (clientTotalRon < 2) {
      return new Response(
        JSON.stringify({
          error: "MIN_AMOUNT",
          min_amount: 2,
          currency: "RON",
          message:
            "Suma totală este sub minimul acceptat de procesatorul de plată (2 RON).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const productTitle = rental.products?.title || "Închiriere";
    const productImage = rental.products?.images?.[0] || undefined;
    const productSlug = rental.products?.slug || "";
    const origin = req.headers.get("origin") || "https://the-rent-exchange.lovable.app";

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Determine capture method based on rental duration.
    // Stripe allows manual-capture holds for max 7 days (standard accounts).
    // For longer rentals, we still use manual capture but log a warning so the
    // platform can monitor / re-authorize before expiry. A future webhook-based
    // reauthorization flow will handle this automatically.
    const useManualCapture = true;
    if (rental.rental_days > MAX_HOLD_DAYS) {
      console.warn(
        `[create-checkout-session] Long rental detected (${rental.rental_days} days) for rental ${rental.id}. ` +
        `Stripe authorization holds expire after ${MAX_HOLD_DAYS} days — monitor and reauthorize before expiry.`
      );
    }

    // Sanitize optional message-to-owner: Stripe metadata values must be <= 500 chars
    const safeMessageToOwner =
      typeof message_to_owner === "string" && message_to_owner.trim().length > 0
        ? message_to_owner.trim().slice(0, 480)
        : "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `${productTitle} — ${rental.rental_days} zile`,
              description: `Închiriere ${rental.start_date} → ${rental.end_date}`,
              ...(productImage ? { images: [productImage] } : {}),
            },
            unit_amount: Math.round(clientTotalRon * 100), // RON → bani (subtotal + comision)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ...(useManualCapture
        ? { payment_intent_data: { capture_method: "manual", metadata: { rental_id: rental.id, renter_id: user.id } } }
        : { payment_intent_data: { metadata: { rental_id: rental.id, renter_id: user.id } } }
      ),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productSlug ? `${origin}/produs/${productSlug}` : `${origin}/`,
      metadata: {
        rental_id: rental.id,
        renter_id: user.id,
        capture_method: useManualCapture ? "manual" : "automatic",
        ...(safeMessageToOwner ? { message_to_owner: safeMessageToOwner } : {}),
      },
    });

    // Store stripe session id on rental for later verification
    await supabaseAdmin
      .from("rentals")
      .update({ payment_method: `stripe:${session.id}` })
      .eq("id", rental_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
