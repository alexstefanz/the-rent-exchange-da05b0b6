import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhoneRO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.trim().replace(/[\s()-]/g, "");
  if (!p) return null;
  if (/^\+40[0-9]{9}$/.test(p)) return p;
  if (/^0040[0-9]{9}$/.test(p)) return "+" + p.slice(2);
  if (/^40[0-9]{9}$/.test(p)) return "+" + p;
  if (/^0[0-9]{9}$/.test(p)) return "+40" + p.slice(1);
  return null;
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const phoneRaw = body && typeof body === "object" ? (body as Record<string, unknown>).phone : null;
    const codeRaw = body && typeof body === "object" ? (body as Record<string, unknown>).code : null;
    if (typeof phoneRaw !== "string" || typeof codeRaw !== "string") {
      return json({ error: "phone_and_code_required" }, 400);
    }
    const phone = normalizePhoneRO(phoneRaw);
    if (!phone) return json({ error: "invalid_phone" }, 400);
    if (!/^[0-9]{6}$/.test(codeRaw)) return json({ error: "invalid_code_format" }, 400);

    const { data: row, error: selErr } = await supabase
      .from("phone_otp_verifications")
      .select("id, code_hash, attempts, expires_at, consumed_at, phone")
      .eq("user_id", userId)
      .eq("phone", phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selErr) {
      console.error("[verify-phone-otp] select error", selErr);
      return json({ error: "db_error" }, 500);
    }
    if (!row) return json({ error: "no_active_code" }, 400);

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase
        .from("phone_otp_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id);
      return json({ error: "expired" }, 400);
    }

    if (row.attempts >= 5) {
      await supabase
        .from("phone_otp_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id);
      return json({ error: "too_many_attempts" }, 429);
    }

    const candidateHash = await sha256(`${userId}:${codeRaw}`);
    if (candidateHash !== row.code_hash) {
      await supabase
        .from("phone_otp_verifications")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      return json({ error: "invalid_code", attemptsLeft: Math.max(0, 4 - row.attempts) }, 400);
    }

    // Success: consume + save phone on profile.
    await supabase
      .from("phone_otp_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", userId);
    if (updErr) {
      console.error("[verify-phone-otp] profile update error", updErr);
      return json({ error: "profile_update_failed" }, 500);
    }

    console.log(`[verify-phone-otp] verified user=${userId} phone=${phone}`);
    return json({ success: true, phone });
  } catch (e) {
    console.error("[verify-phone-otp] unhandled", e);
    return json({ error: "internal_error" }, 500);
  }
});