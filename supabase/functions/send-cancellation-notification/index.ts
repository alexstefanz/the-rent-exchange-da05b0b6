import { invokeAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const { rental_id } = await req.json();

    // Rate limit: 5 per minute per rental
    if (rental_id && !checkRateLimit(`cancel:${rental_id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", rental_id)
      .single();

    if (rentalError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabase.from("products").select("title").eq("id", rental.product_id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", rental.renter_id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", rental.owner_id).single(),
    ]);

    const productTitle = escapeHtml(productRes.data?.title || "Produs");
    const renterName = escapeHtml(renterRes.data?.full_name || "Chiriașul");
    const ownerName = escapeHtml(ownerRes.data?.full_name || "Proprietarul");

    const getEmail = async (userId: string, profileEmail: string | null): Promise<string | null> => {
      if (profileEmail) return profileEmail;
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          await supabase.from("profiles").update({ email: data.user.email }).eq("id", userId);
          return data.user.email;
        }
      } catch (e) {
        console.error("Error fetching auth email:", e);
      }
      return null;
    };

    const [ownerEmail, renterEmail] = await Promise.all([
      getEmail(rental.owner_id, ownerRes.data?.email || null),
      getEmail(rental.renter_id, renterRes.data?.email || null),
    ]);

    const rows = [
      { label: "📦 Produs", value: productTitle },
      { label: "📅 Perioadă", value: `${rental.start_date} → ${rental.end_date}` },
      { label: "⏱ Durată", value: `${rental.rental_days} zile` },
      { label: "💰 Total", value: `${rental.subtotal} RON` },
    ];

    // Insert in-app notification for the owner (server-side only, uses service role)
    if (rental.owner_id) {
      const startDateStr = new Date(rental.start_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
      const endDateStr = new Date(rental.end_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
      await supabase.from("notifications").insert({
        user_id: rental.owner_id,
        type: "rental",
        title_ro: `Cerere anulată: ${productTitle}`,
        title_en: `Request cancelled: ${productTitle}`,
        description_ro: `Chiriașul a anulat cererea de închiriere pentru "${productTitle}" (${startDateStr} - ${endDateStr}).`,
        description_en: `The renter cancelled the rental request for "${productTitle}" (${startDateStr} - ${endDateStr}).`,
        link: "/inchirieri",
      }).catch((e: unknown) => console.error("Notification insert error:", e));
    }

    // Branded transactional emails (respect notification_preferences)
    const startDateStr = new Date(rental.start_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    const endDateStr = new Date(rental.end_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    const productTitleRaw = productRes.data?.title || "produsul";
    const renterNameRaw = renterRes.data?.full_name || "Chiriașul";
    const ownerNameRaw = ownerRes.data?.full_name || "Proprietarul";

    const sendIfAllowed = async (
      userId: string,
      email: string | null,
      templateName: string,
      idempotencyKey: string,
      templateData: Record<string, unknown>,
    ) => {
      if (!email) return;
      try {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_transactional")
          .eq("user_id", userId)
          .maybeSingle();
        if (prefs?.email_transactional === false) return;
        await invokeAppEmail({
          body: { templateName, recipientEmail: email, idempotencyKey, templateData },
        });
      } catch (e) {
        console.error(`[send-cancellation-notification] ${templateName} failed:`, e);
      }
    };

    await Promise.all([
      sendIfAllowed(rental.owner_id, ownerEmail, "cancellation-owner", `cancel-owner-${rental.id}`, {
        name: ownerRes.data?.full_name || undefined,
        renterName: renterNameRaw,
        productTitle: productTitleRaw,
        startDate: startDateStr,
        endDate: endDateStr,
      }),
      sendIfAllowed(rental.renter_id, renterEmail, "cancellation-renter", `cancel-renter-${rental.id}`, {
        name: renterRes.data?.full_name || undefined,
        ownerName: ownerNameRaw,
        productTitle: productTitleRaw,
        startDate: startDateStr,
        endDate: endDateStr,
        cancelledBy: "renter",
        isPaid: ["authorized", "paid", "captured"].includes(String((rental as any).payment_status)),
      }),
    ]);

    // SMS to owner (cancellation by renter) — best-effort
    if (rental.owner_id) {
      try {
        const smsRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            },
            body: JSON.stringify({
              templateKey: "rental_cancelled",
              userId: rental.owner_id,
              rentalId: rental.id,
              variables: {
                productTitle: productRes.data?.title || "produsul",
                link: `https://rentli.ro/inchirieri?rental_id=${rental.id}`,
              },
              idempotencyKey: `rental_cancelled:${rental.id}:${rental.owner_id}`,
            }),
          },
        );
        if (!smsRes.ok) {
          console.error(
            `[send-cancellation-notification] SMS failed status=${smsRes.status} body=${(await smsRes.text()).slice(0, 300)}`,
          );
        }
      } catch (e) {
        console.error("[send-cancellation-notification] SMS invoke failed:", e);
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
