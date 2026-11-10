import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { normalizePhoneRO } from "../_shared/phone.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMS_API_URL = "https://smsalert.mobi/api/v2/message/send";


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
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

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
    if (typeof phoneRaw !== "string") return json({ error: "phone required" }, 400);

    const phone = normalizePhoneRO(phoneRaw);
    if (!phone) return json({ error: "invalid_phone" }, 400);

    // Rate limit: min 60s between sends; max 3 per 10 min per user.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("phone_otp_verifications")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", tenMinAgo)
      .order("created_at", { ascending: false });

    if (recent && recent.length > 0) {
      const lastMs = new Date(recent[0].created_at).getTime();
      if (Date.now() - lastMs < 60_000) {
        const retryIn = Math.ceil((60_000 - (Date.now() - lastMs)) / 1000);
        return json({ error: "rate_limited", retryIn }, 429);
      }
      if (recent.length >= 3) {
        return json({ error: "too_many_requests" }, 429);
      }
    }

    // Invalidate previous unused codes for this user.
    await supabase
      .from("phone_otp_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("consumed_at", null);

    // Generate 6-digit code.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(`${userId}:${code}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insErr } = await supabase
      .from("phone_otp_verifications")
      .insert({ user_id: userId, phone, code_hash: codeHash, expires_at: expiresAt });
    if (insErr) {
      console.error("[send-phone-otp] insert error", insErr);
      return json({ error: "db_error" }, 500);
    }

    // Send SMS.
    const username = Deno.env.get("SMS_ALERT_USERNAME");
    const apiKey = Deno.env.get("SMS_ALERT_API_KEY");
    if (!username || !apiKey) {
      console.error("[send-phone-otp] missing SMS_ALERT creds");
      return json({ error: "sms_not_configured" }, 500);
    }
    const auth = btoa(`${username}:${apiKey}`);
    const message = `Rentli: codul tau de verificare este ${code}. Expira in 10 min.`;

    const res = await fetch(SMS_API_URL, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, message, cleanupUtf8: true }),
    });
    const rawText = await res.text();
    let providerBody: any = null;
    try { providerBody = JSON.parse(rawText); } catch { /* non-json */ }
    const providerOk = res.ok && providerBody && providerBody.status === true;

    // Log the SMS attempt (success or failure) to sms_logs for unified debugging.
    const { error: logErr } = await supabase.from("sms_logs").insert({
      user_id: userId,
      recipient_phone: phone,
      template_key: "phone_otp",
      message_body: message.replace(code, "******"),
      status: providerOk ? "sent" : "failed",
      provider_message_id: providerBody?.id ? String(providerBody.id) : null,
      provider_response: providerBody ?? { raw: rawText.slice(0, 500) },
      error_message: providerOk ? null : (providerBody?.message || providerBody?.error || `http_${res.status}`),
      idempotency_key: `phone_otp:${userId}:${Date.now()}`,
    });
    if (logErr) console.error("[send-phone-otp] sms_logs insert failed", logErr);

    if (!providerOk) {
      console.error(`[send-phone-otp] SMS failed http=${res.status} body=${rawText.slice(0, 300)}`);
      // Invalidate the OTP row so the user can retry immediately without hitting rate limit logic incorrectly.
      await supabase
        .from("phone_otp_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("consumed_at", null);
      return json({
        error: "sms_failed",
        providerStatus: res.status,
        providerMessage: providerBody?.message || providerBody?.error || null,
      }, 502);
    }

    console.log(`[send-phone-otp] code sent to=${phone} user=${userId} providerId=${providerBody?.id ?? "n/a"}`);
    return json({ success: true, phone });
  } catch (e) {
    console.error("[send-phone-otp] unhandled", e);
    return json({ error: "internal_error" }, 500);
  }
}, "POST, OPTIONS"));