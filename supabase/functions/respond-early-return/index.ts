import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, max = 5, windowSec = 60) {
  const now = Date.now();
  const e = rateLimitMap.get(key);
  if (!e || now > e.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  if (e.count >= max) return false;
  e.count++;
  return true;
}

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = u.user.id;
    if (!checkRateLimit(`early-return-resp:${userId}`)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = typeof body?.rental_id === "string" ? body.rental_id : "";
    // Backward compatible: accept legacy "accept" as "approve"
    const rawAction = body?.action;
    const action: "approve" | "reject" | null =
      rawAction === "approve" || rawAction === "accept" ? "approve"
      : rawAction === "reject" ? "reject"
      : null;
    const response = typeof body?.response === "string" ? body.response.trim().slice(0, 500) : "";
    if (!rentalId || !action) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, subtotal, early_return_status, early_return_initiator, early_return_renter_approved_at, early_return_owner_approved_at, early_return_new_end_date, early_return_new_rental_days, early_return_new_subtotal, early_return_refund_amount")
      .eq("id", rentalId)
      .maybeSingle();
    if (rErr || !rental) {
      return new Response(JSON.stringify({ error: "rental_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isRenter = rental.renter_id === userId;
    const isOwner = rental.owner_id === userId;
    if (!isRenter && !isOwner) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // The counterparty must respond — initiator already auto-approved
    if (rental.early_return_initiator && rental.early_return_initiator === userId) {
      return new Response(JSON.stringify({ error: "cannot_respond_own_request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.early_return_status !== "pending") {
      return new Response(JSON.stringify({ error: "no_pending_request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      early_return_owner_response: response || null,
    };

    if (action === "approve") {
      if (isRenter) updates.early_return_renter_approved_at = now;
      if (isOwner) updates.early_return_owner_approved_at = now;
      const renterApproved = isRenter || !!rental.early_return_renter_approved_at;
      const ownerApproved = isOwner || !!rental.early_return_owner_approved_at;
      if (renterApproved && ownerApproved) {
        updates.early_return_status = "accepted";
        updates.early_return_decided_at = now;
        updates.status = "active";
        // Apply the new dates / amounts
        updates.end_date = rental.early_return_new_end_date;
        updates.rental_days = rental.early_return_new_rental_days;
        updates.subtotal = rental.early_return_new_subtotal;
      }
    } else {
      updates.early_return_status = "rejected";
      updates.early_return_decided_at = now;
      updates.status = "active";
    }

    const { error: uErr } = await admin.from("rentals").update(updates).eq("id", rentalId);
    if (uErr) {
      return new Response(JSON.stringify({ error: "update_failed", detail: uErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    admin.functions.invoke("notify-rental-event", {
      body: {
        rental_id: rentalId,
        event_key: action === "approve"
          ? (updates.early_return_status === "accepted" ? "early_return_accepted" : "early_return_approved_partial")
          : "early_return_rejected",
        actor_id: userId,
        extra: { refundAmount: rental.early_return_refund_amount, response },
      },
    }).catch((e) => console.warn("notify early_return response failed", e));

    return new Response(JSON.stringify({ ok: true, action }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("respond-early-return error", e);
    return new Response(JSON.stringify({ error: "internal_error", detail: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));