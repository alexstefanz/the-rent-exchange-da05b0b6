import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

serve(async (req) => {
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
    if (!checkRateLimit(`early-return:${userId}`)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = typeof body?.rental_id === "string" ? body.rental_id : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    if (!rentalId || reason.length < 20) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rental, error: rErr } = await admin
      .from("rentals")
      .select("id, renter_id, owner_id, status, handover_confirmed_at, return_confirmed_at, dispute_status, early_return_status")
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
    if (!rental.handover_confirmed_at) {
      return new Response(JSON.stringify({ error: "not_active" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.return_confirmed_at) {
      return new Response(JSON.stringify({ error: "already_returned" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.dispute_status && rental.dispute_status !== "none") {
      return new Response(JSON.stringify({ error: "dispute_open" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rental.early_return_status === "pending") {
      return new Response(JSON.stringify({ error: "already_requested" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const { error: uErr } = await admin
      .from("rentals")
      .update({
        status: "early_return_requested",
        early_return_status: "pending",
        early_return_requested_at: now,
        early_return_reason: reason,
      })
      .eq("id", rentalId);
    if (uErr) {
      return new Response(JSON.stringify({ error: "update_failed", detail: uErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    admin.functions.invoke("notify-rental-event", {
      body: { rental_id: rentalId, event_key: "early_return_requested", actor_id: userId, extra: { reason } },
    }).catch((e) => console.warn("notify early_return_requested failed", e));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("request-early-return error", e);
    return new Response(JSON.stringify({ error: "internal_error", detail: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});