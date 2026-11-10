import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const productTitle = rental.products?.title || "Închiriere TEST";
    const now = new Date().toISOString();

    const { data: updatedRental, error: updateError } = await supabaseAdmin
      .from("rentals")
      .update({
        payment_status: "authorized",
        payment_method: "test_card_4242",
        is_test_payment: true,
        authorized_at: now,
      })
      .eq("id", rental_id)
      .select("*, products:product_id(title, images, owner_id)")
      .single();

    if (updateError || !updatedRental) {
      console.error("TEST rental update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to authorize test payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const safeMessageToOwner =
        typeof message_to_owner === "string" && message_to_owner.trim().length > 0
          ? message_to_owner.trim().slice(0, 480)
          : typeof updatedRental.message_to_owner === "string"
            ? updatedRental.message_to_owner.trim().slice(0, 480)
            : "";

      const { data: existingConv } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("product_id", updatedRental.product_id)
        .eq("buyer_id", updatedRental.renter_id)
        .eq("owner_id", updatedRental.owner_id)
        .maybeSingle();

      let conversationId = existingConv?.id as string | undefined;
      if (!conversationId) {
        const { data: newConv } = await supabaseAdmin
          .from("conversations")
          .insert({
            product_id: updatedRental.product_id,
            buyer_id: updatedRental.renter_id,
            owner_id: updatedRental.owner_id,
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      if (conversationId) {
        const { data: existingSystem } = await supabaseAdmin
          .from("messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("message_type", "system")
          .limit(1);

        if (!existingSystem || existingSystem.length === 0) {
          const fmt = (d: string) => new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
          const dayLabel = updatedRental.rental_days === 1 ? "zi" : "zile";
          const systemContent =
            `booking_confirmed|${productTitle}|${fmt(updatedRental.start_date)}|${fmt(updatedRental.end_date)}|${updatedRental.rental_days} ${dayLabel}|${updatedRental.subtotal} RON`;

          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            sender_id: null,
            content: systemContent,
            message_type: "system",
          });
        }

        if (safeMessageToOwner) {
          const { data: existingUserMsg } = await supabaseAdmin
            .from("messages")
            .select("id")
            .eq("conversation_id", conversationId)
            .eq("message_type", "user")
            .eq("sender_id", updatedRental.renter_id)
            .limit(1);

          if (!existingUserMsg || existingUserMsg.length === 0) {
            await supabaseAdmin.from("messages").insert({
              conversation_id: conversationId,
              sender_id: updatedRental.renter_id,
              content: safeMessageToOwner,
              message_type: "user",
            });
          }
        }

        await supabaseAdmin
          .from("conversations")
          .update({ updated_at: now })
          .eq("id", conversationId);
      }
    } catch (convErr) {
      console.error("TEST post-payment conversation error (non-blocking):", convErr);
    }

    try {
      await supabaseAdmin.functions.invoke("send-rental-notification", {
        body: { rental_id },
      });
    } catch (notifyErr) {
      console.error("TEST post-payment notification error (non-blocking):", notifyErr);
    }

    return new Response(JSON.stringify({ success: true, is_test: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-test-checkout-session error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}, "POST, OPTIONS"));