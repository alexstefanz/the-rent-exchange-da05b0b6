import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SMS_API_URL = "https://smsalert.mobi/api/v2/message/send";

function normalizePhoneRO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const p = raw.trim().replace(/[\s()-]/g, "");
  if (/^\+40[0-9]{9}$/.test(p)) return p;
  if (/^0040[0-9]{9}$/.test(p)) return "+" + p.slice(2);
  if (/^40[0-9]{9}$/.test(p)) return "+" + p;
  if (/^0[0-9]{9}$/.test(p)) return "+40" + p.slice(1);
  return null;
}
const mask = (p: string) => `${p.slice(0, 4)} ${p.slice(4, 5)}** *** ${p.slice(-3)}`;
async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u, error: ue } = await supabase.auth.getUser(authHeader.slice(7));
    if (ue || !u?.user?.id) return json({ error: "Unauthorized" }, 401);
    const userId = u.user.id;

    const body = await req.json().catch(() => null);
    const rentalId = body?.rental_id;
    if (typeof rentalId !== "string" || !UUID.test(rentalId)) return json({ error: "rental_id invalid" }, 400);

    const { data: r } = await supabase.from("rentals")
      .select("id, public_id, owner_id, renter_id, payment_status, paid_at").eq("id", rentalId).maybeSingle();
    if (!r) return json({ error: "Închirierea nu există" }, 404);
    if (r.owner_id !== userId && r.renter_id !== userId) return json({ error: "Nu ești parte în această închiriere" }, 403);
    if (!["paid", "captured", "authorized"].includes(r.payment_status) && !r.paid_at)
      return json({ error: "Contractul poate fi semnat doar după plată" }, 400);

    const { data: prof } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    const phone = normalizePhoneRO(prof?.phone);
    if (!phone) return json({ error: "no_phone", message: "Adaugă un număr de telefon valid în profil." }, 400);

    const tenMin = new Date(Date.now() - 600_000).toISOString();
    const { data: recent } = await supabase.from("rental_contract_otps").select("created_at")
      .eq("user_id", userId).eq("rental_id", rentalId).gte("created_at", tenMin).order("created_at", { ascending: false });
    if (recent?.length) {
      const diff = Date.now() - new Date(recent[0].created_at).getTime();
      if (diff < 60_000) return json({ error: "rate_limited", retryIn: Math.ceil((60_000 - diff) / 1000) }, 429);
      if (recent.length >= 3) return json({ error: "too_many_requests", message: "Prea multe coduri. Încearcă peste 10 minute." }, 429);
    }

    await supabase.from("rental_contract_otps").update({ consumed_at: new Date().toISOString() })
      .eq("user_id", userId).eq("rental_id", rentalId).is("consumed_at", null);

    const rnd = new Uint32Array(2); crypto.getRandomValues(rnd);
    const code = String(100000 + (rnd[0] % 900000));
    const ref = "VRF-" + rnd[1].toString(16).toUpperCase().padStart(8, "0").slice(0, 6);
    const masked = mask(phone);
    const { error: insErr } = await supabase.from("rental_contract_otps").insert({
      rental_id: rentalId, user_id: userId, phone_masked: masked, ref,
      code_hash: await sha256(`${userId}:${rentalId}:${code}`),
      expires_at: new Date(Date.now() + 600_000).toISOString(),
    });
    if (insErr) { console.error(insErr); return json({ error: "db_error" }, 500); }

    const username = Deno.env.get("SMS_ALERT_USERNAME"), apiKey = Deno.env.get("SMS_ALERT_API_KEY");
    if (!username || !apiKey) return json({ error: "sms_not_configured" }, 500);
    const message = `Rentli: codul pentru semnarea contractului ${r.public_id} este ${code}. Ref ${ref}. Expira in 10 min.`;
    const res = await fetch(SMS_API_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${username}:${apiKey}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, message, cleanupUtf8: true }),
    });
    const raw = await res.text();
    let pb: any = null; try { pb = JSON.parse(raw); } catch { /* */ }
    const ok = res.ok && pb?.status === true;
    await supabase.from("sms_logs").insert({
      user_id: userId, rental_id: rentalId, recipient_phone: phone, template_key: "contract_otp",
      message_body: message.replace(code, "******"), status: ok ? "sent" : "failed",
      provider_message_id: pb?.id ? String(pb.id) : null, provider_response: pb ?? { raw: raw.slice(0, 500) },
      error_message: ok ? null : (pb?.message || pb?.error || `http_${res.status}`),
      idempotency_key: `contract_otp:${userId}:${rentalId}:${Date.now()}`,
    });
    if (!ok) {
      await supabase.from("rental_contract_otps").update({ consumed_at: new Date().toISOString() })
        .eq("user_id", userId).eq("rental_id", rentalId).is("consumed_at", null);
      return json({ error: "sms_failed", message: "SMS-ul nu a putut fi trimis. Încearcă din nou." }, 502);
    }
    return json({ success: true, phone: masked, ref });
  } catch (e) {
    console.error("[send-contract-otp]", e);
    return json({ error: "internal_error" }, 500);
  }
});
