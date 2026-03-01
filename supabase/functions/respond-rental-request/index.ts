import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

const PLATFORM_URL = "https://the-rent-exchange.lovable.app";

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
<body style="margin:0;padding:0;background-color:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <!-- Header -->
  <tr><td style="background-color:#3DB86A;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
    <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">RentNow</span>
  </td></tr>
  <!-- Card -->
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
  <!-- Footer -->
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
    const { rental_id, action, reason } = await req.json();

    if (!rental_id || !["accept", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "rental_id and action (accept/reject) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 10 requests per minute per user
    if (!checkRateLimit(`respond:${user.id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rental, error: rentalError } = await supabaseAdmin
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

    if (rental.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not the owner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.status !== "pending") {
      return new Response(JSON.stringify({ error: "Rental is not pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = action === "accept" ? "confirmed" : "cancelled";
    const updateData: Record<string, unknown> = { status: newStatus };
    if (action === "accept") {
      updateData.confirmed_at = new Date().toISOString();
    } else {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason || "Refuzat de proprietar";
    }

    await supabaseAdmin.from("rentals").update(updateData).eq("id", rental_id);

    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabaseAdmin.from("products").select("title").eq("id", rental.product_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.renter_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.owner_id).single(),
    ]);

    const product = productRes.data;
    const renter = renterRes.data;
    const owner = ownerRes.data;

    const getEmail = async (userId: string, profileEmail: string | null): Promise<string | null> => {
      if (profileEmail) return profileEmail;
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          await supabaseAdmin.from("profiles").update({ email: data.user.email }).eq("id", userId);
          return data.user.email;
        }
      } catch (e) {
        console.error("Error fetching auth email:", e);
      }
      return null;
    };

    const renterEmail = await getEmail(rental.renter_id, renter?.email || null);
    const productTitle = escapeHtml(product?.title || "Produs");
    const ownerName = escapeHtml(owner?.full_name || "Proprietarul");

    const rows = [
      { label: "📦 Produs", value: productTitle },
      { label: "📅 Perioadă", value: `${rental.start_date} → ${rental.end_date}` },
      { label: "⏱ Durată", value: `${rental.rental_days} zile` },
      { label: "💰 Total", value: `${rental.subtotal} RON` },
    ];

    if (action === "accept") {
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost acceptată! 🎉",
        title_en: "Your request was accepted! 🎉",
        description_ro: `${ownerName} a acceptat cererea ta pentru "${productTitle}". Poți discuta detaliile de predare.`,
        description_en: `${ownerName} accepted your request for "${productTitle}". You can discuss pickup details.`,
        link: "/profile#cereri",
      });

      await supabaseAdmin
        .from("transactions")
        .update({ status: "confirmed" })
        .eq("rental_id", rental_id)
        .eq("status", "pending");
    } else {
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost refuzată",
        title_en: "Your request was declined",
        description_ro: `${ownerName} a refuzat cererea pentru "${productTitle}".${reason ? ` Motiv: ${reason}` : ""}`,
        description_en: `${ownerName} declined your request for "${productTitle}".${reason ? ` Reason: ${reason}` : ""}`,
        link: "/profile#cereri",
      });
    }

    // Send emails to both renter and owner
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const ownerEmail = await getEmail(rental.owner_id, owner?.email || null);
    const renterName = escapeHtml(renter?.full_name || "Chiriașul");

    if (resendApiKey) {
      const emailPromises: Promise<unknown>[] = [];

      // Email to renter
      if (renterEmail) {
        let renterHtml: string;
        let renterSubject: string;

        if (action === "accept") {
          renterSubject = `Cererea ta a fost acceptată - ${productTitle}`;
          renterHtml = buildEmailTemplate({
            title: "Cererea ta a fost acceptată! 🎉",
            greeting: `<strong>${ownerName}</strong> a acceptat cererea ta pentru <strong>${productTitle}</strong>. Poți discuta detaliile de predare.`,
            rows,
            ctaText: "Discută detaliile",
            ctaLink: "/profile?tab=rentals",
            footerText: "Contactează proprietarul pentru a stabili detaliile de predare.",
          });
        } else {
          renterSubject = `Cererea ta a fost refuzată - ${productTitle}`;
          const reasonRow = reason ? [{ label: "📝 Motiv", value: escapeHtml(reason) }] : [];
          renterHtml = buildEmailTemplate({
            title: "Cererea ta a fost refuzată",
            greeting: `<strong>${ownerName}</strong> a refuzat cererea pentru <strong>${productTitle}</strong>.`,
            rows: [...rows, ...reasonRow],
            ctaText: "Caută alte produse",
            ctaLink: "/search",
            footerText: "Poți căuta alte produse similare pe platformă.",
          });
        }

        emailPromises.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "RentNow <noreply@rentli.ro>",
              to: [renterEmail],
              subject: renterSubject,
              html: renterHtml,
            }),
          }).catch((e) => console.error("Renter email error:", e))
        );
      }

      // Email to owner (confirmation)
      if (ownerEmail) {
        let ownerHtml: string;
        let ownerSubject: string;

        if (action === "accept") {
          ownerSubject = `Ai acceptat cererea - ${productTitle}`;
          ownerHtml = buildEmailTemplate({
            title: "Ai acceptat cererea! ✅",
            greeting: `Ai acceptat cererea lui <strong>${renterName}</strong> pentru <strong>${productTitle}</strong>. Contactează chiriașul pentru detaliile de predare.`,
            rows,
            ctaText: "Vezi închirierile tale",
            ctaLink: "/profile?tab=lendings",
            footerText: "Stabilește detaliile de predare cu chiriașul.",
          });
        } else {
          ownerSubject = `Ai refuzat cererea - ${productTitle}`;
          const reasonRow = reason ? [{ label: "📝 Motiv", value: escapeHtml(reason) }] : [];
          ownerHtml = buildEmailTemplate({
            title: "Ai refuzat cererea",
            greeting: `Ai refuzat cererea lui <strong>${renterName}</strong> pentru <strong>${productTitle}</strong>.`,
            rows: [...rows, ...reasonRow],
            ctaText: "Vezi anunțurile tale",
            ctaLink: "/profile?tab=lendings",
            footerText: "Produsul tău rămâne disponibil pentru alte cereri.",
          });
        }

        emailPromises.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "RentNow <noreply@rentli.ro>",
              to: [ownerEmail],
              subject: ownerSubject,
              html: ownerHtml,
            }),
          }).catch((e) => console.error("Owner email error:", e))
        );
      }

      await Promise.all(emailPromises);
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
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
