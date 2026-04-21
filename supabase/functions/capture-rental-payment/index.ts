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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Accept both authenticated admin calls and service-role cron calls
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    
    // Check if it's anon key (cron) or user token
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    let isAuthorized = false;
    
    if (token === anonKey) {
      // Called from cron via pg_net — authorized
      isAuthorized = true;
    } else if (token) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, anonKey);
      const { data: authData } = await supabase.auth.getUser(token);
      if (authData?.user) {
        // Check if admin
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        isAuthorized = !!roleData;
      }
    }

    const body = await req.json().catch(() => ({}));
    const { rental_id } = body;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Third authorization path: owner of the specific rental
    if (!isAuthorized && token && rental_id) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, anonKey);
      const { data: authData } = await supabase.auth.getUser(token);
      if (authData?.user) {
        const { data: rentalRow } = await supabaseAdmin
          .from("rentals")
          .select("owner_id")
          .eq("id", rental_id)
          .maybeSingle();
        if (rentalRow && rentalRow.owner_id === authData.user.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a specific rental_id is provided, capture just that one
    if (rental_id) {
      const result = await captureRental(supabaseAdmin, stripe, rental_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.error ? 400 : 200,
      });
    }

    // Otherwise, process all rentals ready for capture
    const today = new Date().toISOString().split("T")[0];
    
    const { data: rentals, error: fetchError } = await supabaseAdmin
      .from("rentals")
      .select("id, payment_intent_id, end_date, owner_id, owner_payout, subtotal, platform_fee, product_id")
      .eq("payment_status", "authorized")
      .lte("end_date", today)
      .not("payment_intent_id", "is", null);

    if (fetchError) {
      console.error("Fetch rentals error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch rentals" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[capture-rental-payment] Found ${rentals?.length || 0} rentals ready for capture`);

    const results = [];
    for (const rental of (rentals || [])) {
      try {
        const result = await captureRental(supabaseAdmin, stripe, rental.id, rental);
        results.push(result);
      } catch (e) {
        console.error(`Error capturing rental ${rental.id}:`, e);
        results.push({ rental_id: rental.id, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("capture-rental-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function captureRental(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  rentalId: string,
  preloadedRental?: Record<string, unknown>,
) {
  // Fetch rental if not preloaded
  let rental = preloadedRental;
  if (!rental) {
    const { data, error } = await supabaseAdmin
      .from("rentals")
      .select("id, payment_intent_id, end_date, owner_id, owner_payout, subtotal, platform_fee, product_id")
      .eq("id", rentalId)
      .single();
    if (error || !data) return { rental_id: rentalId, error: "Rental not found" };
    rental = data;
  }

  if (!rental.payment_intent_id) {
    return { rental_id: rentalId, error: "No payment_intent_id" };
  }

  // Capture the payment intent
  try {
    const paymentIntent = await stripe.paymentIntents.capture(rental.payment_intent_id as string);
    
    if (paymentIntent.status !== "succeeded") {
      return { rental_id: rentalId, error: `Capture failed: ${paymentIntent.status}` };
    }
  } catch (e) {
    // If already captured, that's fine
    if (e.code === "payment_intent_unexpected_state") {
      console.log(`Payment intent ${rental.payment_intent_id} already captured`);
    } else {
      throw e;
    }
  }

  const now = new Date().toISOString();

  // Update rental status
  await supabaseAdmin
    .from("rentals")
    .update({
      payment_status: "captured",
      captured_at: now,
      paid_at: now,
    })
    .eq("id", rentalId);

  // Create transaction records
  // Platform fee transaction
  await supabaseAdmin.from("transactions").insert({
    rental_id: rentalId,
    user_id: null,
    type: "platform_fee",
    amount: rental.platform_fee as number,
    status: "completed",
    processed_at: now,
    description: `Comision platformă - rental ${rentalId}`,
  });

  // Owner payout transaction (pending until manual transfer)
  await supabaseAdmin.from("transactions").insert({
    rental_id: rentalId,
    user_id: rental.owner_id as string,
    type: "owner_payout",
    amount: rental.owner_payout as number,
    status: "completed",
    processed_at: now,
    description: `Câștig din închiriere - rental ${rentalId}`,
  });

  console.log(`[capture-rental-payment] Successfully captured rental ${rentalId}`);

  return { rental_id: rentalId, success: true, captured_at: now };
}
