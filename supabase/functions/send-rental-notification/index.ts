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
    const { rental_id } = await req.json();
    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
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

    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabaseAdmin.from("products").select("title, images").eq("id", rental.product_id).single(),
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
        console.error("Error fetching auth user email:", e);
      }
      return null;
    };

    const [ownerEmail, renterEmail] = await Promise.all([
      getEmail(rental.owner_id, owner?.email || null),
      getEmail(rental.renter_id, renter?.email || null),
    ]);

    // Insert transaction
    await supabaseAdmin.from("transactions").insert({
      rental_id: rental.id,
      user_id: rental.renter_id,
      amount: rental.subtotal,
      type: "rental_payment",
      status: "pending",
      description: `Plată închiriere: ${product?.title || "Produs"}`,
      currency: "RON",
    });

    // Insert notifications
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: rental.owner_id,
        type: "rental_request",
        title_ro: `Cerere nouă de închiriere`,
        title_en: `New rental request`,
        description_ro: `${renter?.full_name || "Un utilizator"} dorește să închirieze "${product?.title}" pentru ${rental.rental_days} zile.`,
        description_en: `${renter?.full_name || "A user"} wants to rent "${product?.title}" for ${rental.rental_days} days.`,
        link: `/profile#anunturi`,
      },
      {
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: `Cerere trimisă cu succes`,
        title_en: `Request sent successfully`,
        description_ro: `Cererea ta pentru "${product?.title}" a fost trimisă proprietarului. Vei fi notificat când va răspunde.`,
        description_en: `Your request for "${product?.title}" has been sent to the owner. You'll be notified when they respond.`,
        link: `/profile#cereri`,
      },
    ]);

    // Send emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && (ownerEmail || renterEmail)) {
      const productTitle = product?.title || "Produs";
      const renterName = renter?.full_name || "Un utilizator";
      const rows = [
        { label: "📦 Produs", value: productTitle },
        { label: "📅 Perioadă", value: `${rental.start_date} → ${rental.end_date}` },
        { label: "⏱ Durată", value: `${rental.rental_days} zile` },
        { label: "💰 Total", value: `${rental.subtotal} RON` },
      ];

      const sendEmail = async (to: string, subject: string, html: string) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "RentNow <onboarding@resend.dev>",
              to: [to],
              subject,
              html,
            }),
          });
          const result = await res.text();
          console.log(`Email sent to ${to}:`, result);
        } catch (e) {
          console.error("Email send error:", e);
        }
      };

      if (ownerEmail) {
        const html = buildEmailTemplate({
          title: "Ai o cerere nouă de închiriere! 🎉",
          greeting: `<strong>${renterName}</strong> dorește să închirieze produsul tău <strong>${productTitle}</strong>.`,
          rows: [...rows, { label: "💵 Vei primi", value: `${rental.owner_payout} RON` }],
          ctaText: "Vezi cererea",
          ctaLink: "/profile?tab=lendings",
          footerText: "Accesează platforma pentru a accepta sau refuza cererea.",
        });
        await sendEmail(ownerEmail, `Cerere nouă de închiriere - ${productTitle}`, html);
      }

      if (renterEmail) {
        const html = buildEmailTemplate({
          title: "Cererea ta a fost trimisă! ✉️",
          greeting: `Ai solicitat închirierea produsului <strong>${productTitle}</strong>. Proprietarul va fi notificat imediat.`,
          rows,
          ctaText: "Vezi statusul cererii",
          ctaLink: "/profile?tab=rentals",
          footerText: "Vei fi notificat când proprietarul va răspunde la cererea ta.",
        });
        await sendEmail(renterEmail, `Cererea ta a fost trimisă - ${productTitle}`, html);
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
