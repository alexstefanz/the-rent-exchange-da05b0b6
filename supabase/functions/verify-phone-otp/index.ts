import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

Deno.serve(withCors(async (req) => {
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
      .update({ phone, phone_verified: true })
      .eq("id", userId);
    if (updErr) {
      console.error("[verify-phone-otp] profile update error", updErr);
      return json({ error: "profile_update_failed" }, 500);
    }

    // Mark email as confirmed — phone OTP is our real verification mechanism.
    // Idempotent: if email is already confirmed, this is a no-op for our flow.
    try {
      const { error: confirmErr } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (confirmErr) {
        console.error("[verify-phone-otp] email_confirm error", confirmErr);
      }
    } catch (e) {
      console.error("[verify-phone-otp] email_confirm threw", e);
    }

    // Send a confirmation SMS that the phone number was added/changed.
    // Non-blocking: a failure here must not fail the verification itself.
    try {
      const username = Deno.env.get("SMS_ALERT_USERNAME");
      const apiKey = Deno.env.get("SMS_ALERT_API_KEY");
      if (username && apiKey) {
        const message = `Rentli: numarul de telefon ${phone} a fost verificat si asociat contului tau. Daca nu ai facut tu aceasta schimbare, contacteaza-ne pe rentli.ro.`;
        const res = await fetch("https://smsalert.mobi/api/v2/message/send", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${username}:${apiKey}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: phone, message, cleanupUtf8: true }),
        });
        const rawText = await res.text();
        let providerBody: any = null;
        try { providerBody = JSON.parse(rawText); } catch { /* non-json */ }
        const providerOk = res.ok && providerBody && providerBody.status === true;

        const { error: logErr } = await supabase.from("sms_logs").insert({
          user_id: userId,
          recipient_phone: phone,
          template_key: "phone_verified_confirm",
          message_body: message,
          status: providerOk ? "sent" : "failed",
          provider_message_id: providerBody?.id ? String(providerBody.id) : null,
          provider_response: providerBody ?? { raw: rawText.slice(0, 500) },
          error_message: providerOk ? null : (providerBody?.message || providerBody?.error || `http_${res.status}`),
          idempotency_key: `phone_verified_confirm:${userId}:${Date.now()}`,
        });
        if (logErr) console.error("[verify-phone-otp] sms_logs insert failed", logErr);
        if (!providerOk) {
          console.error(`[verify-phone-otp] confirm SMS failed http=${res.status} body=${rawText.slice(0, 300)}`);
        }
      } else {
        console.error("[verify-phone-otp] missing SMS_ALERT creds for confirm SMS");
      }
    } catch (e) {
      console.error("[verify-phone-otp] confirm SMS threw", e);
    }

    console.log(`[verify-phone-otp] verified user=${userId} phone=${phone}`);
    return json({ success: true, phone });
  } catch (e) {
    console.error("[verify-phone-otp] unhandled", e);
    return json({ error: "internal_error" }, 500);
  }
}, "POST, OPTIONS"));