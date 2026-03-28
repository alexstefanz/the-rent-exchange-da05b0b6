const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEST_EMAIL = "aleczanderr20@gmail.com";
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
    ${rowsHtml ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DF;border-bottom:1px solid #E8E4DF;margin-bottom:24px;padding:8px 0;">${rowsHtml}</table>` : ''}
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

async function sendTestEmail(resendApiKey: string, subject: string, html: string, fromDomain = "noreply@rentli.ro") {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `RentNow <${fromDomain}>`,
      to: [TEST_EMAIL],
      subject: `[TEST] ${subject}`,
      html,
    }),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(result));
  }
  return result;
}

const TEMPLATES: Record<string, (resendApiKey: string) => Promise<unknown>> = {
  // 1. Welcome
  welcome: async (key) => {
    const html = buildEmailTemplate({
      title: "Bine ai venit pe RentNow! 🎉",
      greeting: "Salut Alexandru! 👋<br><br>Contul tău a fost creat cu succes. Pe RentNow poți închiria sau lista produse în câteva minute. Explorează categoriile și începe acum!",
      rows: [
        { label: "🔍 Caută produse", value: "Găsește ce ai nevoie" },
        { label: "📦 Listează produse", value: "Câștigă din ce ai" },
        { label: "💬 Chat integrat", value: "Comunică ușor" },
      ],
      ctaText: "Explorează platforma",
      ctaLink: "/",
      footerText: "Mulțumim că te-ai alăturat comunității RentNow!",
    });
    return sendTestEmail(key, "Bine ai venit pe RentNow! 🎉", html);
  },

  // 2. Review received
  review_received: async (key) => {
    const html = buildEmailTemplate({
      title: "Ai primit o recenzie nouă! ⭐",
      greeting: "Salut Alexandru,<br>Cineva ți-a lăsat o recenzie pe platforma RentNow.",
      rows: [
        { label: "👤 De la", value: "Maria Popescu" },
        { label: "⭐ Rating", value: "⭐⭐⭐⭐⭐ (5/5)" },
        { label: "📦 Produs", value: "Canon EOS R5 - Body" },
        { label: "💬 Comentariu", value: "Foarte bun, exact ca în poze!" },
      ],
      ctaText: "Vezi recenzia",
      ctaLink: "/profile",
      footerText: "Recenziile ajută comunitatea să funcționeze mai bine.",
    });
    return sendTestEmail(key, "Ai primit o recenzie nouă - ⭐⭐⭐⭐⭐", html);
  },

  // 3. Product published
  product_published: async (key) => {
    const html = buildEmailTemplate({
      title: "Produsul tău a fost publicat! 🚀",
      greeting: "Felicitări Alexandru! 🎊<br>Produsul tău <strong>Canon EOS R5 - Body</strong> este acum vizibil pe platforma RentNow și poate fi închiriat de alți utilizatori.",
      rows: [
        { label: "📦 Produs", value: "Canon EOS R5 - Body" },
        { label: "📊 Status", value: "Activ ✅" },
      ],
      ctaText: "Vezi anunțul",
      ctaLink: "/owner",
      footerText: "Poți gestiona produsele tale oricând din secțiunea Produsele mele.",
    });
    return sendTestEmail(key, "Produsul tău „Canon EOS R5 - Body" a fost publicat!", html);
  },

  // 4. Rental new - owner
  rental_new_owner: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
      { label: "💵 Vei primi", value: "675 RON" },
    ];
    const html = buildEmailTemplate({
      title: "Ai o cerere nouă de închiriere! 🎉",
      greeting: "<strong>Maria Popescu</strong> dorește să închirieze produsul tău <strong>Canon EOS R5 - Body</strong>.",
      rows,
      ctaText: "Vezi cererea",
      ctaLink: "/profile?tab=lendings",
      footerText: "Accesează platforma pentru a accepta sau refuza cererea.",
    });
    return sendTestEmail(key, "Cerere nouă de închiriere - Canon EOS R5 - Body", html);
  },

  // 5. Rental new - renter
  rental_new_renter: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
    ];
    const html = buildEmailTemplate({
      title: "Cererea ta a fost trimisă! ✉️",
      greeting: "Ai solicitat închirierea produsului <strong>Canon EOS R5 - Body</strong>. Proprietarul va fi notificat imediat.",
      rows,
      ctaText: "Vezi statusul cererii",
      ctaLink: "/profile?tab=rentals",
      footerText: "Vei fi notificat când proprietarul va răspunde la cererea ta.",
    });
    return sendTestEmail(key, "Cererea ta a fost trimisă - Canon EOS R5 - Body", html);
  },

  // 6. Message new
  message_new: async (key) => {
    const html = buildEmailTemplate({
      title: "Ai primit un mesaj nou 💬",
      greeting: "<strong>Maria Popescu</strong> ți-a trimis un mesaj referitor la <strong>Canon EOS R5 - Body</strong>.",
      rows: [
        { label: "👤 De la", value: "Maria Popescu" },
        { label: "📦 Produs", value: "Canon EOS R5 - Body" },
        { label: "💬 Mesaj", value: "Bună, este disponibil weekendul acesta?" },
      ],
      ctaText: "Citește mesajul",
      ctaLink: "/profile?tab=messages",
      footerText: "Răspunde rapid pentru o experiență mai bună.",
    });
    return sendTestEmail(key, "Mesaj nou de la Maria Popescu - Canon EOS R5 - Body", html);
  },

  // 7. Cancellation - owner
  cancellation_owner: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
    ];
    const html = buildEmailTemplate({
      title: "O cerere a fost anulată",
      greeting: "<strong>Maria Popescu</strong> a anulat cererea de închiriere pentru <strong>Canon EOS R5 - Body</strong>.",
      rows,
      ctaText: "Vezi anunțurile tale",
      ctaLink: "/profile?tab=lendings",
      footerText: "Produsul tău este din nou disponibil pentru alte cereri.",
    });
    return sendTestEmail(key, "Cerere anulată - Canon EOS R5 - Body", html);
  },

  // 8. Cancellation - renter
  cancellation_renter: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
    ];
    const html = buildEmailTemplate({
      title: "Cererea ta a fost anulată",
      greeting: "Ai anulat cererea de închiriere pentru <strong>Canon EOS R5 - Body</strong> de la <strong>Ion Ionescu</strong>.",
      rows,
      ctaText: "Caută alte produse",
      ctaLink: "/search",
      footerText: "Poți căuta alte produse similare pe platformă.",
    });
    return sendTestEmail(key, "Confirmare anulare - Canon EOS R5 - Body", html);
  },

  // 9. Password changed
  password_changed: async (key) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("ro-RO", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const html = buildEmailTemplate({
      title: "Parola ta a fost schimbată",
      greeting: "Parola contului tău RentNow a fost schimbată cu succes. Dacă nu tu ai făcut această modificare, te rugăm să ne contactezi imediat.",
      rows: [
        { label: "Data schimbării", value: dateStr },
        { label: "Cont", value: TEST_EMAIL },
      ],
      ctaText: "Accesează contul",
      ctaLink: "/auth",
      footerText: "Ai primit acest email deoarece parola contului tău a fost schimbată.",
    });
    return sendTestEmail(key, "Parola ta a fost schimbată - RentNow", html);
  },

  // 10. Rental accepted
  rental_accepted: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
    ];
    const html = buildEmailTemplate({
      title: "Cererea ta a fost acceptată! 🎉",
      greeting: "<strong>Ion Ionescu</strong> a acceptat cererea ta pentru <strong>Canon EOS R5 - Body</strong>. Poți discuta detaliile de predare.",
      rows,
      ctaText: "Discută detaliile",
      ctaLink: "/profile?tab=rentals",
      footerText: "Contactează proprietarul pentru a stabili detaliile de predare.",
    });
    return sendTestEmail(key, "Cererea ta a fost acceptată - Canon EOS R5 - Body", html);
  },

  // 11. Rental rejected
  rental_rejected: async (key) => {
    const rows = [
      { label: "📦 Produs", value: "Canon EOS R5 - Body" },
      { label: "📅 Perioadă", value: "2026-04-01 → 2026-04-05" },
      { label: "⏱ Durată", value: "5 zile" },
      { label: "💰 Total", value: "750 RON" },
      { label: "📝 Motiv", value: "Produsul este deja rezervat" },
    ];
    const html = buildEmailTemplate({
      title: "Cererea ta a fost refuzată",
      greeting: "<strong>Ion Ionescu</strong> a refuzat cererea pentru <strong>Canon EOS R5 - Body</strong>.",
      rows,
      ctaText: "Caută alte produse",
      ctaLink: "/search",
      footerText: "Poți căuta alte produse similare pe platformă.",
    });
    return sendTestEmail(key, "Cererea ta a fost refuzată - Canon EOS R5 - Body", html);
  },

  // 12. Account deactivation
  deactivation: async (key) => {
    const token = "test-token-" + crypto.randomUUID();
    const confirmLink = `${PLATFORM_URL}/dezactivare-cont?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Confirmare dezactivare cont</h2>
        <p>Ai solicitat dezactivarea contului tău pe Rentli.</p>
        <p>Dacă ești sigur că dorești să dezactivezi contul, apasă butonul de mai jos:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Dezactivează contul
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link-ul expiră în 24 de ore.</p>
        <p style="color: #666; font-size: 14px;">Dacă nu ai solicitat dezactivarea contului, ignoră acest email.</p>
      </div>`;
    // This one uses noreply@resend.dev like the original
    return sendTestEmail(key, "Confirmare dezactivare cont", html, "noreply@resend.dev");
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    if (!type || !TEMPLATES[type]) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Available: ${Object.keys(TEMPLATES).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await TEMPLATES[type](resendApiKey);

    return new Response(
      JSON.stringify({ success: true, type, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
