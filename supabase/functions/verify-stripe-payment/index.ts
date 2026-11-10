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

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine whether this rental was paid with the TEST card (admin) or LIVE.
    // We look up the rental by the stored payment_method = `stripe:${session_id}`
    // BEFORE talking to Stripe, so we pick the right secret key.
    const supabaseAdminEarly = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rentalLookup } = await supabaseAdminEarly
      .from("rentals")
      .select("id, is_test_payment")
      .eq("payment_method", `stripe:${session_id}`)
      .maybeSingle();
    const isTest = !!rentalLookup?.is_test_payment;
    const stripeKey = isTest
      ? Deno.env.get("STRIPE_TEST_SECRET_KEY")
      : Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: isTest ? "STRIPE_TEST_SECRET_KEY not configured" : "STRIPE_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    const rentalId = session.metadata?.rental_id;
    if (!rentalId) {
      return new Response(JSON.stringify({ error: "No rental_id in session metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
    if (!paymentIntent) {
      return new Response(
        JSON.stringify({ error: "No payment intent found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine status based on payment intent state
    let paymentStatus: string;
    let paidAt: string | null = null;
    let authorizedAt: string | null = null;
    const now = new Date().toISOString();

    if (paymentIntent.status === "requires_capture") {
      // Manual capture — funds are held but not yet debited
      paymentStatus = "authorized";
      authorizedAt = now;
    } else if (paymentIntent.status === "succeeded") {
      // Automatic capture — funds already captured (for rentals > 7 days)
      paymentStatus = "paid";
      paidAt = now;
      authorizedAt = now;
    } else {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: paymentIntent.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update rental payment status using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      payment_method: "stripe",
      payment_intent_id: paymentIntent.id,
    };
    if (paidAt) updateData.paid_at = paidAt;
    if (authorizedAt) updateData.authorized_at = authorizedAt;

    const { data: rental, error: updateError } = await supabaseAdmin
      .from("rentals")
      .update(updateData)
      .eq("id", rentalId)
      .select("*, products:product_id(title, images, owner_id)")
      .single();

    if (updateError) {
      console.error("Update rental error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update rental" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Post-payment side effects (fire-and-forget; never block the success response).
    // 1) Create conversation + first message if the renter sent a message at checkout.
    // 2) Trigger owner/renter notifications + emails.
    try {
      const messageToOwner = (session.metadata?.message_to_owner || "").trim();

      // Always create/find the conversation for this rental, regardless of whether
      // the renter typed a custom message. We want a chat available for the owner.
      const { data: existingConv } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("product_id", rental.product_id)
        .eq("buyer_id", rental.renter_id)
        .eq("owner_id", rental.owner_id)
        .maybeSingle();

      let conversationId = existingConv?.id as string | undefined;
      if (!conversationId) {
        const { data: newConv } = await supabaseAdmin
          .from("conversations")
          .insert({
            product_id: rental.product_id,
            buyer_id: rental.renter_id,
            owner_id: rental.owner_id,
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      if (conversationId) {
        // 1) Insert a system "booking confirmed" notification (idempotent).
        const { data: existingSystem } = await supabaseAdmin
          .from("messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("message_type", "system")
          .limit(1);

        if (!existingSystem || existingSystem.length === 0) {
          const productTitle = rental.products?.title || "produsul tău";
          const days = rental.rental_days as number;
          const dayLabel = days === 1 ? "zi" : "zile";
          const fmt = (d: string) => {
            try {
              return new Date(d).toLocaleDateString("ro-RO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            } catch {
              return d;
            }
          };
          // Pipe-separated payload parsed by the frontend SystemMessageBubble.
          const systemContent =
            `booking_confirmed|${productTitle}|${fmt(rental.start_date)}|${fmt(rental.end_date)}|${days} ${dayLabel}|${rental.subtotal} RON`;

          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            sender_id: null,
            content: systemContent,
            message_type: "system",
          });

          await supabaseAdmin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        // 2) If the renter typed an optional message at checkout, post it as a normal user message (idempotent).
        if (messageToOwner) {
          const { data: existingUserMsg } = await supabaseAdmin
            .from("messages")
            .select("id")
            .eq("conversation_id", conversationId)
            .eq("message_type", "user")
            .eq("sender_id", rental.renter_id)
            .limit(1);

          if (!existingUserMsg || existingUserMsg.length === 0) {
            await supabaseAdmin.from("messages").insert({
              conversation_id: conversationId,
              sender_id: rental.renter_id,
              content: messageToOwner,
              message_type: "user",
            });

            await supabaseAdmin
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);

            try {
              await supabaseAdmin.functions.invoke("send-message-notification", {
                body: {
                  conversation_id: conversationId,
                  sender_id: rental.renter_id,
                  message_content: messageToOwner,
                },
              });
            } catch (msgNotifyErr) {
              console.error("Message notification error (non-blocking):", msgNotifyErr);
            }
          }
        }
      }
    } catch (convErr) {
      console.error("Post-payment conversation/message error (non-blocking):", convErr);
    }

    try {
      await supabaseAdmin.functions.invoke("send-rental-notification", {
        body: { rental_id: rentalId },
      });
    } catch (notifyErr) {
      console.error("Post-payment notification error (non-blocking):", notifyErr);
    }

    // Also fire the centralized timeline event so both parties get an in-app
    // toast + email through the unified notify-rental-event pipeline.
    try {
      await supabaseAdmin.functions.invoke("notify-rental-event", {
        body: { rental_id: rentalId, event_key: "payment_succeeded" },
      });
    } catch (evErr) {
      console.error("Post-payment notify-rental-event error (non-blocking):", evErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_status: paymentStatus,
        rental: {
          id: rental.id,
            public_id: rental.public_id,
          product_title: rental.products?.title,
          product_images: rental.products?.images,
          start_date: rental.start_date,
          end_date: rental.end_date,
          rental_days: rental.rental_days,
          subtotal: rental.subtotal,
          owner_id: rental.owner_id,
          product_id: rental.product_id,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("verify-stripe-payment error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}, "POST, OPTIONS"));
