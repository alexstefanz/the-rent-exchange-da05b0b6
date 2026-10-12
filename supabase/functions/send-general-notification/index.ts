import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 5, windowSec = 60): boolean {
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

// All sends go through send-transactional-email, which enqueues on the
// internal email queue delivered via the verified notify.rentli.ro domain.
// The root rentli.ro domain is not a verified sender, so direct sends fail.
async function sendTemplatedEmail(
  templateName: string,
  recipientEmail: string,
  templateData: Record<string, unknown>,
  idempotencyKey: string,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabaseAdmin.functions.invoke("send-transactional-email", {
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  });
  if (error) throw new Error(`send-transactional-email failed: ${error.message}`);
  if (data?.error) throw new Error(`send-transactional-email error: ${data.error}`);
  console.log(`Email queued to ${recipientEmail} (template=${templateName})`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const body = await req.json();
    const { type } = body;

    if (!type) {
      return new Response(JSON.stringify({ error: "type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Helper to get email from user_id
    const getUserEmail = async (userId: string): Promise<{ email: string | null; fullName: string | null }> => {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (profile?.email) return { email: profile.email, fullName: profile.full_name };

      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          await supabaseAdmin.from("profiles").update({ email: data.user.email }).eq("id", userId);
          return { email: data.user.email, fullName: profile?.full_name || null };
        }
      } catch (e) {
        console.error("Error fetching auth user email:", e);
      }
      return { email: null, fullName: profile?.full_name || null };
    };

    // ==================== WELCOME ====================
    if (type === "welcome") {
      const { email, full_name } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "email required for welcome" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!checkRateLimit(`welcome:${email}`)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await sendTemplatedEmail(
        "welcome",
        email,
        { name: full_name || undefined },
        `welcome-${email}-${Date.now()}`,
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== REVIEW RECEIVED ====================
    if (type === "review_received") {
      const { reviewer_name, rating, comment, recipient_user_id, product_title } = body;
      if (!recipient_user_id) {
        return new Response(JSON.stringify({ error: "recipient_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!checkRateLimit(`review:${recipient_user_id}`, 10, 60)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { email, fullName } = await getUserEmail(recipient_user_id);
      if (!email) {
        return new Response(JSON.stringify({ success: true, skipped: "no email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stars = "⭐".repeat(Math.min(rating || 0, 5));
      const reviewerDisplay = escapeHtml(reviewer_name || "Un utilizator");
      const recipientName = escapeHtml(fullName || "");
      const greetingName = recipientName ? `Salut ${recipientName},` : "Salut,";

      const rows: { label: string; value: string }[] = [
        { label: "👤 De la", value: reviewerDisplay },
        { label: "⭐ Rating", value: `${stars} (${rating}/5)` },
      ];
      if (product_title) {
        rows.push({ label: "📦 Produs", value: escapeHtml(product_title) });
      }
      if (comment) {
        rows.push({ label: "💬 Comentariu", value: escapeHtml(comment) });
      }

      const titleRo = product_title
        ? `Ai primit un review pentru "${product_title}"`
        : "Ai primit un review nou";
      const titleEn = product_title
        ? `You received a review for "${product_title}"`
        : "You received a new review";

      const html = buildEmailTemplate({
        title: `${titleRo} ⭐`,
        greeting: `${greetingName}<br>Cineva ți-a lăsat o recenzie pe platforma Rentli.`,
        rows,
        ctaText: "Vezi recenzia",
        ctaLink: "/profile",
        footerText: "Recenziile ajută comunitatea să funcționeze mai bine.",
      });

      await sendEmail(email, `${titleRo} - ${stars}`, html);

      // Also insert a notification
      await supabaseAdmin.from("notifications").insert({
        user_id: recipient_user_id,
        type: "review_received",
        title_ro: titleRo,
        title_en: titleEn,
        description_ro: `${reviewerDisplay} ți-a lăsat o recenzie de ${rating} stele.${product_title ? ` Produs: ${product_title}` : ""}`,
        description_en: `${reviewerDisplay} left you a ${rating}-star review.${product_title ? ` Product: ${product_title}` : ""}`,
        link: "/recenzii",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== PRODUCT PUBLISHED ====================
    if (type === "product_published") {
      const { user_id, product_title, product_slug } = body;
      if (!user_id || !product_title) {
        return new Response(JSON.stringify({ error: "user_id and product_title required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!checkRateLimit(`product:${user_id}`, 10, 60)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { email, fullName } = await getUserEmail(user_id);
      if (!email) {
        return new Response(JSON.stringify({ success: true, skipped: "no email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const title = escapeHtml(product_title);
      const name = escapeHtml(fullName || "");
      const greetingName = name ? `Felicitări ${name}! 🎊` : "Felicitări! 🎊";
      const productLink = product_slug ? `/product/${product_slug}` : "/owner";

      const html = buildEmailTemplate({
        title: "Produsul tau a fost publicat! \u{1F680}",
        greeting: `${greetingName}<br>Produsul tau <strong>${title}</strong> este acum vizibil pe platforma Rentli si poate fi inchiriat de alti utilizatori.`,
        rows: [
          { label: "\u{1F4E6} Produs", value: title },
          { label: "\u{1F4CA} Status", value: "Activ \u2705" },
        ],
        ctaText: "Vezi anuntul",
        ctaLink: productLink,
        footerText: "Poti gestiona produsele tale oricand din sectiunea Produsele mele.",
      });

      await sendEmail(email, `Produsul tău „${product_title}" a fost publicat!`, html);

      // Also insert a notification
      await supabaseAdmin.from("notifications").insert({
        user_id,
        type: "product_published",
        title_ro: "Produsul tău a fost publicat",
        title_en: "Your product has been published",
        description_ro: `Produsul „${product_title}" este acum activ pe platformă.`,
        description_en: `The product "${product_title}" is now active on the platform.`,
        link: productLink,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400,
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
