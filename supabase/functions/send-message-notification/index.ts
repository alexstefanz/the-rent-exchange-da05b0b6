import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { invokeAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 10, windowSec = 60): boolean {
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

const PLATFORM_URL = "https://rentli.ro";

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function buildEmailTemplate(opts: {
  title: string;
  greeting: string;
  rows: { label: string; value: string }[];
  ctaText: string;
  ctaLink: string;
  footerText: string;
}) {
  const rowsHtml = opts.rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;color:#6B6155;font-size:14px;">${r.label}</td><td style="padding:6px 0;color:#2D2517;font-size:14px;font-weight:600;text-align:right;">${r.value}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAF9F7;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="background-color:#F59E0B;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
    <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Rentli</span>
  </td></tr>
  <tr><td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 8px;color:#2D2517;font-size:20px;">${opts.title}</h2>
    <p style="margin:0 0 24px;color:#6B6155;font-size:15px;line-height:1.5;">${opts.greeting}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DF;border-bottom:1px solid #E8E4DF;margin-bottom:24px;padding:8px 0;">
      ${rowsHtml}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${PLATFORM_URL}${opts.ctaLink}" style="display:inline-block;background-color:#F59E0B;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">${opts.ctaText}</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#9B9489;font-size:12px;">${opts.footerText}</p>
    <p style="margin:8px 0 0;"><a href="${PLATFORM_URL}" style="color:#F59E0B;font-size:12px;text-decoration:none;">rentli.ro</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const { conversation_id, sender_id, message_content } = await req.json();

    // Rate limit: 10 messages per minute per sender
    if (sender_id && !checkRateLimit(`msg:${sender_id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!conversation_id || !sender_id || !message_content) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get conversation details
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("buyer_id, owner_id, product_id")
      .eq("id", conversation_id)
      .single();

    if (convError || !conv) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine recipient
    const recipientId = conv.buyer_id === sender_id ? conv.owner_id : conv.buyer_id;

    // Fetch sender name, recipient profile, and product title in parallel
    const [senderRes, recipientRes, productRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", sender_id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", recipientId).single(),
      supabase.from("products").select("title").eq("id", conv.product_id).single(),
    ]);

    const senderName = escapeHtml(senderRes.data?.full_name || "Cineva");
    const productTitle = escapeHtml(productRes.data?.title || "un produs");

    // Insert in-app notification (so it shows up in /notificari "Mesaje" tab)
    try {
      const senderNameRaw = senderRes.data?.full_name || "Cineva";
      const productTitleRaw = productRes.data?.title || "un produs";
      const preview =
        message_content.length > 140 ? message_content.substring(0, 140) + "…" : message_content;
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "new_message",
        title_ro: `Mesaj nou de la ${senderNameRaw}`,
        title_en: `New message from ${senderNameRaw}`,
        description_ro: `${productTitleRaw}: ${preview}`,
        description_en: `${productTitleRaw}: ${preview}`,
        link: `/mesaje?conv=${conversation_id}`,
      });
    } catch (e) {
      console.error("Notification insert error:", e);
    }

    // Get recipient email with fallback
    let recipientEmail = recipientRes.data?.email || null;
    if (!recipientEmail) {
      try {
        const { data } = await supabase.auth.admin.getUserById(recipientId);
        if (data?.user?.email) {
          recipientEmail = data.user.email;
          await supabase.from("profiles").update({ email: data.user.email }).eq("id", recipientId);
        }
      } catch (e) {
        console.error("Error fetching auth email:", e);
      }
    }

    // Anti-spam: max one external notification (email/SMS) per conversation
    // per recipient every 30 minutes. In-app notifications above are unaffected.
    let allowExternal = true;
    try {
      const { data: claimed, error: claimErr } = await supabase.rpc("claim_chat_notification", {
        _conversation_id: conversation_id,
        _recipient_id: recipientId,
        _minutes: 30,
      });
      if (!claimErr) allowExternal = claimed === true;
      else console.error("[send-message-notification] cooldown claim failed:", claimErr);
    } catch (e) {
      console.error("[send-message-notification] cooldown error:", e);
    }

    // Send branded transactional email (respect notification_preferences)
    if (recipientEmail && allowExternal) {
      try {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_transactional, email_chat")
          .eq("user_id", recipientId)
          .maybeSingle();
        if (prefs?.email_transactional !== false && prefs?.email_chat !== false) {
          const preview = message_content.length > 140
            ? message_content.substring(0, 140) + "…"
            : message_content;
          await invokeAppEmail({
            body: {
              templateName: "new-message",
              recipientEmail,
              idempotencyKey: `new-message-${conversation_id}-${Date.now()}`,
              templateData: {
                name: recipientRes.data?.full_name || undefined,
                senderName: senderRes.data?.full_name || "Cineva",
                productTitle: productRes.data?.title || "un produs",
                messagePreview: preview,
              },
            },
          });
        }
      } catch (e) {
        console.error("[send-message-notification] email invoke failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));
