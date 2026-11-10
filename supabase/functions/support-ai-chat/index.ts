import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

// Per-caller in-memory rate limit to prevent AI cost abuse.
const aiRateLimit = new Map<string, { count: number; resetAt: number }>();
function checkAiRateLimit(key: string, max = 20, windowSec = 60): boolean {
  const now = Date.now();
  const entry = aiRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    aiRateLimit.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Ești asistentul virtual Rentli (platformă închiriere obiecte). Vorbești DOAR în română, scurt și prietenos.

OBIECTIV: colectezi informația minimă pentru un ticket în MAX 3 întrebări, apoi generezi draft, apoi creezi ticket la confirmare.

REGULI STRICTE:
1. Pune MAXIMUM 3 întrebări totale înainte de \`draft_ticket\`. Numără în mintea ta întrebările tale anterioare. Dacă ai pus deja 3, NU mai întreba — apelează \`draft_ticket\` ACUM cu informația pe care o ai.
2. O singură întrebare per mesaj, max 1-2 propoziții.
3. La fiecare întrebare, apelează \`propose_quick_replies\` cu 3-5 chips scurte (max 4 cuvinte). Userul preferă să tape, nu să scrie.
4. Nu repeta întrebări deja puse. Nu cere clarificări dacă răspunsul anterior e suficient.

FLOW OBLIGATORIU:
- ÎNTREBAREA 1 (Categorie): dacă nu o știi din context, oferă chips ["Rezervare", "Produs", "Plată", "Cont", "Altceva"]. Dacă userul a tapat deja un chip de categorie sau ai context clar (produs/rezervare deschisă), SARI peste această întrebare.
- ÎNTREBAREA 2 (Ce s-a întâmplat): cea mai importantă. Specifică pe categorie. Ex: "Care e problema cu produsul?" cu chips ["Defect", "Lipsă piese", "Diferit de descriere", "Altceva"].
- ÎNTREBAREA 3 (opțional - clarificare scurtă): doar dacă chiar e necesară. Poate fi sugestia de atașament prin \`propose_attachment_hint\` în loc de întrebare textuală.
- DRAFT: apelează \`draft_ticket\` cu subject/description/category_group/category_type/priority. Mesajul tău text trebuie să fie scurt: "Am pregătit ticketul. Verifică și confirmă."
- CREATE: la PRIMUL mesaj user după draft care conține "confirm", "trimite", "ok", "da", "yes", "send", "merge" → apelează IMEDIAT \`create_support_ticket\` cu EXACT aceleași fields ca în draft. NU mai pune întrebări. NU mai sugera atașamente. NU repeta draftul.
- DACĂ userul scrie "modifică", "schimbă", "edit" → întreabă scurt ce să modifice și reapelează \`draft_ticket\` cu schimbarea.

ATAȘAMENTE: sugerează O SINGURĂ DATĂ, opțional, în paralel cu draftul (în mesajul care precede draftul). NICIODATĂ după draft.

CONTEXT: dacă userul e pe pagina unui produs sau are rezervare deschisă, presupune categoria și SARI direct la întrebarea 2.

PRIORITATE (obligatoriu la create_support_ticket):
- CRITICAL: fraudă, abuz/hărțuire, dispute financiare mari, cont blocat, pericol.
- HIGH: bani neîntorși, produs neîntors, anulare după start închiriere, daune mari.
- MEDIUM: probleme rezervări viitoare, întrebări plată, neconcordanțe minore.
- LOW: întrebări generale, sugestii, feedback.

NU oferi soluții tehnice. Rolul tău e doar să colectezi info și să creezi ticketul.`;

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const caller = await requireCaller(req);
    if (!caller) return unauthorizedResponse(corsHeaders);
    const rateKey = caller.userId ?? "service";
    if (!checkAiRateLimit(rateKey)) {
      return new Response(
        JSON.stringify({ error: "Prea multe cereri. Te rugăm să aștepți câteva secunde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextBlock = "";
    if (context && typeof context === "object") {
      const parts: string[] = [];
      if (context.route) parts.push(`Pagina curentă: ${context.route}`);
      if (context.productTitle) parts.push(`Produs vizionat: "${context.productTitle}" (id: ${context.productId})`);
      if (context.reservationId) parts.push(`Rezervare deschisă: id ${context.reservationId}`);
      if (parts.length > 0) {
        contextBlock = `\n\nCONTEXT UTILIZATOR (folosește pentru a personaliza întrebările și a presetota categoria):\n${parts.join("\n")}`;
      }
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + contextBlock;

    const tools = [
      {
        type: "function",
        function: {
          name: "propose_quick_replies",
          description:
            "Show the user 3-5 short quick-reply chips below your message. Use for category selection and short branching answers. Keep each label under 4 words.",
          parameters: {
            type: "object",
            properties: {
              chips: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
              },
            },
            required: ["chips"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "propose_attachment_hint",
          description:
            "Suggest the user attach an image/screenshot. Provide a one-line hint shown next to the input.",
          parameters: {
            type: "object",
            properties: { hint: { type: "string" } },
            required: ["hint"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "draft_ticket",
          description:
            "Generate a draft of the ticket for the user to review BEFORE creation. Always call this before create_support_ticket. The user will confirm or edit.",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string", description: "Short ticket title (max 100 chars)" },
              description: { type: "string", description: "Compiled description of the issue" },
              category_group: {
                type: "string",
                enum: ["RESERVATION", "PRODUCT", "FINANCIAL", "DISPUTE", "USER"],
              },
              category_type: {
                type: "string",
                enum: [
                  "OWNER_CANT_FULFILL", "LATE_HANDOVER", "NO_SHOW", "RESERVATION_CHANGE", "CANCELLATION_ISSUE",
                  "DEFECTIVE", "DAMAGED_ON_RETURN", "MISSING_PARTS", "NOT_AS_DESCRIBED",
                  "PAYMENT_ISSUE", "REFUND_REQUEST", "REFUND_DISPUTE", "CHARGEBACK", "PENALTY",
                  "OWNER_VS_RENTER", "DAMAGE_LIABILITY", "DEPOSIT_DISPUTE",
                  "FRAUD_SUSPECTED", "ABUSIVE_BEHAVIOR", "GENERAL_INQUIRY",
                ],
              },
              priority: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              },
            },
            required: ["subject", "description", "category_group", "category_type", "priority"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_support_ticket",
          description:
            "Final step: actually creates the ticket. ONLY call after the user has explicitly confirmed the draft from draft_ticket. Reuse exactly the fields from the confirmed draft (or user's edits).",
          parameters: {
            type: "object",
            properties: {
              subject: {
                type: "string",
                description: "A short title summarizing the issue (max 100 chars)",
              },
              description: {
                type: "string",
                description:
                  "A detailed description of the issue, compiled from the conversation",
              },
              category_group: {
                type: "string",
                enum: ["RESERVATION", "PRODUCT", "FINANCIAL", "DISPUTE", "USER"],
                description: "The main category group of the issue",
              },
              category_type: {
                type: "string",
                enum: [
                  "OWNER_CANT_FULFILL", "LATE_HANDOVER", "NO_SHOW", "RESERVATION_CHANGE", "CANCELLATION_ISSUE",
                  "DEFECTIVE", "DAMAGED_ON_RETURN", "MISSING_PARTS", "NOT_AS_DESCRIBED",
                  "PAYMENT_ISSUE", "REFUND_REQUEST", "REFUND_DISPUTE", "CHARGEBACK", "PENALTY",
                  "OWNER_VS_RENTER", "DAMAGE_LIABILITY", "DEPOSIT_DISPUTE",
                  "FRAUD_SUSPECTED", "ABUSIVE_BEHAVIOR", "GENERAL_INQUIRY",
                ],
                description: "The specific category type of the issue",
              },
              priority: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                description: "Issue urgency. Use the rules from the system prompt.",
              },
            },
            required: ["subject", "description", "category_group", "category_type", "priority"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          tools,
          temperature: 0.3,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Prea multe cereri. Te rugăm să aștepți câteva secunde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviciul AI nu este disponibil momentan." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Eroare internă" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}, "POST, OPTIONS"));
