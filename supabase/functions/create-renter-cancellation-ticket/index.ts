import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limit (per isolate)
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

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user from JWT
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    if (!checkRateLimit(`renter-cancel-ticket:${userId}`, 5, 60)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = typeof body?.rental_id === "string" ? body.rental_id : "";
    if (!rentalId) {
      return new Response(JSON.stringify({ error: "missing_rental_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load rental + product context
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, product_id, status, payment_status, payment_intent_id, subtotal, start_date, end_date, products(title)")
      .eq("id", rentalId)
      .maybeSingle();
    if (rErr || !rental) {
      return new Response(JSON.stringify({ error: "rental_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.renter_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productTitle = (rental as any).products?.title || "Produs";
    const piId = rental.payment_intent_id || "—";

    // Idempotency: if an active ticket already exists for this rental + renter,
    // return it instead of creating a duplicate.
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
      return new Response(
        JSON.stringify({ ok: true, ticket_id: existing.id, public_id: existing.public_id, deduplicated: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const description =
      `Chiriașul a anulat cererea pentru "${productTitle}" înainte ca proprietarul să răspundă.\n\n` +
      `Trebuie eliberat hold-ul Stripe (refund / cancel pe payment intent).\n\n` +
      `• Rental ID: ${rental.id}\n` +
      `• Payment Intent: ${piId}\n` +
      `• Sumă: ${rental.subtotal} RON\n` +
      `• Perioadă: ${rental.start_date} → ${rental.end_date}\n` +
      `• Status plată: ${rental.payment_status}\n`;

    const { data: ticket, error: tErr } = await admin
      .from("ops_tickets")
      .insert({
        title: `Anulare cerere plătită — eliberare hold Stripe (${productTitle})`,
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
        tags: ["renter-cancel", "stripe-hold"],
      })
      .select("id, public_id")
      .single();
    if (tErr || !ticket) {
      return new Response(JSON.stringify({ error: "ticket_create_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Internal admin note with quick Stripe link
    const stripeLink = piId !== "—"
      ? `https://dashboard.stripe.com/payments/${piId}`
      : "(payment intent indisponibil)";
    await admin.from("ops_ticket_messages").insert({
      ticket_id: ticket.id,
      author_type: "SYSTEM",
      author_id: null,
      is_internal: true,
      message_text: `Acțiune necesară: deschide ${stripeLink} și fă refund / cancel pe payment intent.`,
    });

    return new Response(
      JSON.stringify({ ok: true, ticket_id: ticket.id, public_id: ticket.public_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-renter-cancellation-ticket error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));
