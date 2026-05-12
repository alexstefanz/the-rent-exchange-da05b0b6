import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Admin-only gate
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "FORBIDDEN_ADMIN_ONLY" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rental_id, message_to_owner } = await req.json();
    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const testKey = Deno.env.get("STRIPE_TEST_SECRET_KEY");
    if (!testKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_TEST_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!testKey.startsWith("sk_test_")) {
      return new Response(
        JSON.stringify({ error: "STRIPE_TEST_SECRET_KEY must be a sk_test_ key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(testKey, { apiVersion: "2025-08-27.basil" });

    const productTitle = rental.products?.title || "Închiriere TEST";
    const productImage = rental.products?.images?.[0] || undefined;
    const productSlug = rental.products?.slug || "";
    const origin = req.headers.get("origin") || "https://the-rent-exchange.lovable.app";

    const safeMessageToOwner =
      typeof message_to_owner === "string" && message_to_owner.trim().length > 0
        ? message_to_owner.trim().slice(0, 480)
        : "";

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email!,
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `[TEST] ${productTitle} — ${rental.rental_days} zile`,
              description: `TEST PAYMENT (admin): Închiriere ${rental.start_date} → ${rental.end_date}`,
              ...(productImage ? { images: [productImage] } : {}),
            },
            unit_amount: Math.round(rental.subtotal * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual",
        metadata: { rental_id: rental.id, renter_id: user.id, is_test: "true" },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productSlug ? `${origin}/produs/${productSlug}` : `${origin}/`,
      metadata: {
        rental_id: rental.id,
        renter_id: user.id,
        capture_method: "manual",
        is_test: "true",
        ...(safeMessageToOwner ? { message_to_owner: safeMessageToOwner } : {}),
      },
    });

    // Mark the rental as a test payment BEFORE returning, so verify/capture flows
    // know which Stripe key to use.
    await supabaseAdmin
      .from("rentals")
      .update({
        payment_method: `stripe:${session.id}`,
        is_test_payment: true,
      })
      .eq("id", rental_id);

    return new Response(JSON.stringify({ url: session.url, is_test: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-test-checkout-session error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});