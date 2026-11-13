import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withCors, getCorsHeaders } from "../_shared/cors.ts";
import { requireServiceCaller } from "../_shared/authGuard.ts";
import { normalizePhoneRO } from "../_shared/phone.ts";

const SMS_API_URL = "https://smsalert.mobi/api/v2/message/send";
const COOLDOWN_MIN = 10;

Deno.serve(withCors(async (req) => {
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    if (!(await requireServiceCaller(req))) return json({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.notification_id === "string" ? body.notification_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid notification_id" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: n } = await supabase.from("admin_notifications").select("*").eq("id", id).maybeSingle();
    const { data: s } = await supabase.from("admin_sms_settings").select("*").eq("id", 1).maybeSingle();
    if (!n || !s?.enabled) return json({ skipped: true });

    const phones = new Set<string>();
    for (const p of s.extra_phones ?? []) { const x = normalizePhoneRO(p); if (x) phones.add(x); }
    if (s.notify_all_admins) {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("phone").in("id", ids)
          .eq("phone_verified", true).eq("is_banned", false);
        for (const p of profs ?? []) { const x = p.phone && normalizePhoneRO(p.phone); if (x) phones.add(x); }
      }
    }
    if (!phones.size) return json({ skipped: "no_recipients" });

    const title = String(n.title_ro ?? "Notificare").slice(0, 90);
    const message = `[Rentli Admin] ${title}. Detalii: rentli.ro${n.link ?? "/admin/notificari"}`.slice(0, 300);
    const templateKey = `admin_alert_${n.type}`;
    const since = new Date(Date.now() - COOLDOWN_MIN * 60_000).toISOString();
    const username = Deno.env.get("SMS_ALERT_USERNAME");
    const apiKey = Deno.env.get("SMS_ALERT_API_KEY");
    if (!username || !apiKey) { console.error("[admin-sms] missing credentials"); return json({ error: "Internal error" }, 500); }
    const auth = "Basic " + btoa(`${username}:${apiKey}`);

    let sent = 0;
    for (const phone of phones) {
      const { count } = await supabase.from("sms_logs").select("id", { count: "exact", head: true })
        .eq("recipient_phone", phone).eq("template_key", templateKey).eq("status", "sent").gte("created_at", since);
      if ((count ?? 0) > 0 && n.priority !== "high") continue;
      let status = "failed", providerId: string | null = null, err: string | null = null, resp: unknown = null;
      try {
        const r = await fetch(SMS_API_URL, { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone, message, cleanupUtf8: true }) });
        resp = await r.json().catch(() => null);
        if (r.ok) { status = "sent"; sent++; providerId = (resp as any)?.data?.id?.toString?.() ?? null; }
        else err = `HTTP ${r.status}`;
      } catch (e) { err = String(e); }
      await supabase.from("sms_logs").insert({ recipient_phone: phone, template_key: templateKey, message_body: message,
        status, provider_message_id: providerId, provider_response: resp, error_message: err,
        idempotency_key: `admin:${id}:${phone}` });
    }
    return json({ sent });
  } catch (e) {
    console.error("[admin-sms]", e);
    return json({ error: "Internal error" }, 500);
  }
}));
