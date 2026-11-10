import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { normalizePhoneRO } from "../_shared/phone.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMS_API_URL = "https://smsalert.mobi/api/v2/message/send";
const PLATFORM_URL = "rentli.ro";

// Templates addressed to the OWNER. All others default to the renter view.
const OWNER_TEMPLATES = new Set<string>([
  "rental_request_owner",
  "rental_accepted_owner",
  "rental_cancelled_owner",
  "return_reminder_owner",
  "return_deadline_2h_owner",
  "request_reminder_2h_owner",
  "request_expired_owner",
]);

/**
 * Build a per-template deep link to the specific rental.
 * - Owner-facing templates → /inchirieri?rental_id=...
 * - Renter-facing templates → /rezervari?rental_id=...
 * Falls back to the list route when rentalId is missing.
 */
function defaultLinkFor(key: string, rentalId?: string | null): string {
  const isOwner = OWNER_TEMPLATES.has(key);
  const base = isOwner ? `${PLATFORM_URL}/inchirieri` : `${PLATFORM_URL}/rezervari`;
  return rentalId ? `${base}?rental_id=${rentalId}` : base;
}

type TemplateKey =
  | "rental_request_owner"
  | "rental_request_renter"
  | "rental_accepted"
  | "rental_accepted_owner"
  | "rental_rejected"
  | "rental_cancelled"
  | "rental_cancelled_owner"
  | "return_reminder"
  | "return_reminder_owner"
  | "return_deadline_2h"
  | "return_deadline_2h_owner"
  | "pickup_scheduled"
  | "pv_pending"
  | "pv_other_done"
  | "return_in_progress"
  | "rental_completed"
  | "dispute_opened"
  | "review_reminder"
  | "request_reminder_2h_owner"
  | "request_reminder_2h_renter"
  | "request_expired_owner"
  | "request_expired_renter";

type TemplateVars = {
  productTitle?: string;
  renterName?: string;
  ownerName?: string;
  link?: string;
  pickupDate?: string;
  pickupLocation?: string;
  otherPartyName?: string;
};

/**
 * Render an SMS body for a given template key.
 * Uses ASCII / no diacritics so messages stay under 160 chars (GSM-7, 1 SMS credit).
 */
function renderTemplate(key: TemplateKey, v: TemplateVars, rentalId?: string | null): string {
  const title = stripDiacritics(v.productTitle || "produsul").slice(0, 40);
  const renter = stripDiacritics(v.renterName || "Un utilizator").slice(0, 30);
  const owner = stripDiacritics(v.ownerName || "proprietarul").slice(0, 30);
  const other = stripDiacritics(v.otherPartyName || "Cealalta parte").slice(0, 30);
  const link = v.link || defaultLinkFor(key, rentalId);
  const when = stripDiacritics(v.pickupDate || "").slice(0, 30);
  const place = stripDiacritics(v.pickupLocation || "").slice(0, 40);

  switch (key) {
    case "rental_request_owner":
      return `Rentli: cerere noua pt "${title}" de la ${renter}. Detalii: ${link}`;
    case "rental_request_renter":
      return `Rentli: cererea ta pt "${title}" a fost trimisa. Astepti raspuns de la ${owner}. ${link}`;
    case "rental_accepted":
      return `Rentli: cererea ta pt "${title}" a fost ACCEPTATA. Detalii: ${link}`;
    case "rental_accepted_owner":
      return `Rentli: ai acceptat cererea lui ${renter} pt "${title}". Urmeaza plata. ${link}`;
    case "rental_rejected":
      return `Rentli: cererea pt "${title}" a fost refuzata. Detalii: ${link}`;
    case "rental_cancelled":
      return `Rentli: rezervarea pt "${title}" a fost anulata. Detalii: ${link}`;
    case "rental_cancelled_owner":
      return `Rentli: ${renter} a anulat cererea pt "${title}" inainte de plata. ${link}`;
    case "return_reminder":
      return `Rentli: returneaza azi "${title}". Contacteaza ${owner} pt predare. ${link}`;
    case "return_reminder_owner":
      return `Rentli: ${renter} trebuie sa returneze azi "${title}". ${link}`;
    case "return_deadline_2h":
      return `Rentli: URGENT - 2h pana la deadline pt "${title}". Finalizeaza returnarea: ${link}`;
    case "return_deadline_2h_owner":
      return `Rentli: 2h pana ${renter} returneaza "${title}". ${link}`;
    case "pickup_scheduled":
      return `Rentli: predare "${title}"${when ? ` pe ${when}` : ""}${place ? ` la ${place}` : ""}. Detalii: ${link}`;
    case "pv_pending":
      return `Rentli: completeaza procesul verbal pt "${title}". Link: ${link}`;
    case "pv_other_done":
      return `Rentli: ${other} a completat PV pt "${title}". Verifica: ${link}`;
    case "return_in_progress":
      return `Rentli: returnare "${title}" - completeaza PV. Link: ${link}`;
    case "rental_completed":
      return `Rentli: inchirierea "${title}" a fost finalizata. Detalii: ${link}`;
    case "dispute_opened":
      return `Rentli: disputa deschisa pt "${title}". Suport: ${link}`;
    case "review_reminder":
      return `Rentli: lasa un review pt "${title}". ${link}`;
    case "request_reminder_2h_owner":
      return `Rentli: URGENT - mai ai 2h sa raspunzi la cererea pt "${title}" sau se anuleaza automat. ${link}`;
    case "request_reminder_2h_renter":
      return `Rentli: asteptam raspunsul lui ${owner} pt "${title}". Mai are 2h. ${link}`;
    case "request_expired_owner":
      return `Rentli: cererea pt "${title}" a expirat (24h fara raspuns) si a fost anulata automat. ${link}`;
    case "request_expired_renter":
      return `Rentli: cererea pt "${title}" a expirat fara raspuns. Hold-ul a fost eliberat. ${link}`;
  }
}

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ăâ]/gi, "a")
    .replace(/[î]/gi, "i")
    .replace(/[șş]/gi, "s")
    .replace(/[țţ]/gi, "t");
}


function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const {
      templateKey,
      userId,
      rentalId,
      variables,
      idempotencyKey,
      phoneOverride,
    } = body as {
      templateKey?: TemplateKey;
      userId?: string;
      rentalId?: string | null;
      variables?: TemplateVars;
      idempotencyKey?: string;
      phoneOverride?: string;
    };

    // Validation
    const allowedTemplates: TemplateKey[] = [
      "rental_request_owner",
      "rental_request_renter",
      "rental_accepted",
      "rental_accepted_owner",
      "rental_rejected",
      "rental_cancelled",
      "rental_cancelled_owner",
      "return_reminder",
      "return_reminder_owner",
      "return_deadline_2h",
      "return_deadline_2h_owner",
      "pickup_scheduled",
      "pv_pending",
      "pv_other_done",
      "return_in_progress",
      "rental_completed",
      "dispute_opened",
      "review_reminder",
      "request_reminder_2h_owner",
      "request_reminder_2h_renter",
      "request_expired_owner",
      "request_expired_renter",
    ];
    if (!templateKey || !allowedTemplates.includes(templateKey)) {
      return jsonResponse({ error: "Invalid templateKey" }, 400);
    }
    if (!userId || typeof userId !== "string") {
      return jsonResponse({ error: "userId required" }, 400);
    }
    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return jsonResponse({ error: "idempotencyKey required" }, 400);
    }

    const username = Deno.env.get("SMS_ALERT_USERNAME");
    const apiKey = Deno.env.get("SMS_ALERT_API_KEY");
    if (!username || !apiKey) {
      console.error("[send-sms-notification] Missing SMS_ALERT credentials");
      return jsonResponse({ error: "SMS provider not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin-only override: allows sending to a custom phone number for testing.
    // Bypasses profile checks (banned, opt-out) but requires verified admin JWT.
    let overrideAdminId: string | null = null;
    if (phoneOverride && typeof phoneOverride === "string") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse({ error: "phoneOverride requires admin authentication" }, 401);
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user?.id) {
        return jsonResponse({ error: "Invalid admin token" }, 401);
      }
      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (roleErr || isAdmin !== true) {
        return jsonResponse({ error: "phoneOverride requires admin role" }, 403);
      }
      overrideAdminId = userData.user.id;
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from("sms_logs")
      .select("id, status, provider_message_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      console.log(`[send-sms-notification] Cache hit for ${idempotencyKey} (status=${existing.status})`);
      return jsonResponse({ success: true, cached: true, status: existing.status });
    }

    const message = renderTemplate(templateKey, variables || {}, rentalId || null);

    // === ADMIN OVERRIDE PATH ===
    if (phoneOverride && overrideAdminId) {
      const normalizedOverride = normalizePhoneRO(phoneOverride);
      if (!normalizedOverride) {
        return jsonResponse({ error: "Invalid phoneOverride format" }, 400);
      }

      const username = Deno.env.get("SMS_ALERT_USERNAME")!;
      const apiKey = Deno.env.get("SMS_ALERT_API_KEY")!;
      const auth = btoa(`${username}:${apiKey}`);

      let providerStatus = 0;
      let providerJson: unknown = null;
      let providerText = "";
      let networkError: string | null = null;

      try {
        const res = await fetch(SMS_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: normalizedOverride, message, cleanupUtf8: true }),
        });
        providerStatus = res.status;
        providerText = await res.text();
        try { providerJson = JSON.parse(providerText); } catch { providerJson = { raw: providerText }; }
      } catch (e) {
        networkError = String((e as Error).message);
        console.error("[send-sms-notification] OVERRIDE network error:", networkError);
      }

      const okOv = !networkError && providerStatus >= 200 && providerStatus < 300;
      const providerMessageIdOv =
        (providerJson && typeof providerJson === "object" &&
          ((providerJson as Record<string, unknown>).message_id as string | undefined ||
            (providerJson as Record<string, unknown>).id as string | undefined)) || null;

      const provResp = {
        provider: providerJson,
        test: true,
        override: true,
        requested_by_admin: overrideAdminId,
      };

      await supabase.from("sms_logs").insert({
        user_id: userId,
        rental_id: rentalId || null,
        recipient_phone: normalizedOverride,
        template_key: templateKey,
        message_body: message,
        status: okOv ? "sent" : "failed",
        provider_message_id: providerMessageIdOv,
        provider_response: provResp,
        error_message: okOv ? null : (networkError || `HTTP ${providerStatus}: ${providerText.slice(0, 200)}`),
        idempotency_key: idempotencyKey,
      });

      if (!okOv) {
        console.error(`[send-sms-notification] OVERRIDE FAILED status=${providerStatus} body=${providerText.slice(0, 200)}`);
        return jsonResponse({ success: false, override: true, status: providerStatus, error: networkError || providerText }, 200);
      }
      console.log(`[send-sms-notification] OVERRIDE sent to=${normalizedOverride} by admin=${overrideAdminId}`);
      return jsonResponse({ success: true, override: true, status: providerStatus, messageId: providerMessageIdOv, to: normalizedOverride });
    }

    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone, sms_notifications_enabled, is_banned, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[send-sms-notification] Profile load error:", profileError);
      return jsonResponse({ error: "Profile lookup failed" }, 500);
    }

    // Skip conditions: log skipped reason and exit OK
    const logSkip = async (phone: string, reason: string) => {
      await supabase.from("sms_logs").insert({
        user_id: userId,
        rental_id: rentalId || null,
        recipient_phone: phone,
        template_key: templateKey,
        message_body: message,
        status: "skipped",
        error_message: reason,
        idempotency_key: idempotencyKey,
      });
    };

    if (!profile) {
      await logSkip("", "profile_not_found");
      return jsonResponse({ success: true, skipped: "profile_not_found" });
    }
    if (profile.is_banned) {
      await logSkip(profile.phone || "", "user_banned");
      return jsonResponse({ success: true, skipped: "user_banned" });
    }
    if (profile.sms_notifications_enabled === false) {
      await logSkip(profile.phone || "", "sms_opt_out");
      return jsonResponse({ success: true, skipped: "sms_opt_out" });
    }

    const normalized = normalizePhoneRO(profile.phone);
    if (!normalized) {
      await logSkip(profile.phone || "", "invalid_phone");
      return jsonResponse({ success: true, skipped: "invalid_phone" });
    }

    // Send via SMS Alert API (Basic Auth, JSON body with phoneNumber field)
    const auth = btoa(`${username}:${apiKey}`);
    const payload = {
      phoneNumber: normalized,
      message,
      cleanupUtf8: true,
    };

    let providerStatus = 0;
    let providerJson: unknown = null;
    let providerText = "";
    let networkError: string | null = null;

    try {
      const res = await fetch(SMS_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      providerStatus = res.status;
      providerText = await res.text();
      try {
        providerJson = JSON.parse(providerText);
      } catch {
        providerJson = { raw: providerText };
      }
    } catch (e) {
      networkError = String((e as Error).message);
      console.error("[send-sms-notification] Network error:", networkError);
    }

    const ok = !networkError && providerStatus >= 200 && providerStatus < 300;
    const providerMessageId =
      (providerJson && typeof providerJson === "object" &&
        ((providerJson as Record<string, unknown>).message_id as string | undefined ||
          (providerJson as Record<string, unknown>).id as string | undefined)) || null;

    await supabase.from("sms_logs").insert({
      user_id: userId,
      rental_id: rentalId || null,
      recipient_phone: normalized,
      template_key: templateKey,
      message_body: message,
      status: ok ? "sent" : "failed",
      provider_message_id: providerMessageId,
      provider_response: providerJson as Record<string, unknown>,
      error_message: ok ? null : (networkError || `HTTP ${providerStatus}: ${providerText.slice(0, 200)}`),
      idempotency_key: idempotencyKey,
    });

    if (!ok) {
      console.error(`[send-sms-notification] FAILED status=${providerStatus} body=${providerText.slice(0, 200)}`);
      return jsonResponse({ success: false, status: providerStatus, error: networkError || providerText }, 200);
    }

    console.log(`[send-sms-notification] sent template=${templateKey} to=${normalized}`);
    return jsonResponse({ success: true, status: providerStatus, messageId: providerMessageId });
  } catch (error) {
    console.error("[send-sms-notification] Unhandled error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}, "POST, OPTIONS"));