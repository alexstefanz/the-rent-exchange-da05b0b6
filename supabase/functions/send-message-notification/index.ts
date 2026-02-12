import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_URL = "https://the-rent-exchange.lovable.app";

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
<body style="margin:0;padding:0;background-color:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="background-color:#3DB86A;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
    <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">RentNow</span>
  </td></tr>
  <tr><td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 8px;color:#2D2517;font-size:20px;">${opts.title}</h2>
    <p style="margin:0 0 24px;color:#6B6155;font-size:15px;line-height:1.5;">${opts.greeting}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DF;border-bottom:1px solid #E8E4DF;margin-bottom:24px;padding:8px 0;">
      ${rowsHtml}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${PLATFORM_URL}${opts.ctaLink}" style="display:inline-block;background-color:#3DB86A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">${opts.ctaText}</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#9B9489;font-size:12px;">${opts.footerText}</p>
    <p style="margin:8px 0 0;"><a href="${PLATFORM_URL}" style="color:#3DB86A;font-size:12px;text-decoration:none;">the-rent-exchange.lovable.app</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, sender_id, message_content } = await req.json();

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

    const senderName = senderRes.data?.full_name || "Cineva";
    const productTitle = productRes.data?.title || "un produs";

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

    // Send email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && recipientEmail) {
      const preview = message_content.length > 100 ? message_content.substring(0, 100) + "..." : message_content;

      const html = buildEmailTemplate({
        title: "Ai primit un mesaj nou 💬",
        greeting: `<strong>${senderName}</strong> ți-a trimis un mesaj referitor la <strong>${productTitle}</strong>.`,
        rows: [
          { label: "👤 De la", value: senderName },
          { label: "📦 Produs", value: productTitle },
          { label: "💬 Mesaj", value: preview },
        ],
        ctaText: "Citește mesajul",
        ctaLink: "/profile?tab=messages",
        footerText: "Răspunde rapid pentru o experiență mai bună.",
      });

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RentNow <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: `Mesaj nou de la ${senderName} - ${productTitle}`,
            html,
          }),
        });
      } catch (e) {
        console.error("Email error:", e);
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
});
