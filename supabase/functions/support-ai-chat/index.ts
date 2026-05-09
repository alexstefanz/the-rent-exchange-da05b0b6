import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Ești asistentul virtual al platformei Rentli, o platformă de închiriere de obiecte între persoane fizice din România.

REGULI:
- Răspunde DOAR în limba română, scurt și prietenos.
- Scopul tău este să ghidezi utilizatorul în 4 pași simpli pentru a crea un ticket: (1) categorie, (2) detalii, (3) atașamente (opțional), (4) confirmare.
- Pune MAXIMUM o întrebare per mesaj. Mesaje scurte (1-2 propoziții).
- La fiecare întrebare, oferă variante rapide apelând tool-ul \`propose_quick_replies\` cu 3-5 opțiuni scurte (max 4 cuvinte fiecare) — niciodată mai mult.
- PASUL 1 (categorie): Dacă nu o poți deduce din context, întreabă categoria și apelează \`propose_quick_replies\` cu chips: ["Rezervare", "Produs", "Plată", "Cont/KYC", "Altceva"].
- PASUL 2 (detalii): pune 1-2 întrebări țintite în funcție de categorie. Oferă chips relevante când e posibil (ex: "În ce stadiu e?", chips: ["Înainte de start", "În desfășurare", "După returnare"]).
- PASUL 3 (atașamente): sugerează blând să atașeze poze/screenshot-uri dacă e relevant (daune, dovezi plată, erori UI). Folosește \`propose_attachment_hint\`.
- PASUL 4 (confirmare): când ai suficiente informații, NU crea direct ticketul. Apelează ÎNTÂI \`draft_ticket\` cu titlu/categorie/prioritate/sumar — utilizatorul va confirma sau edita.
- Doar după ce utilizatorul confirmă explicit (răspunde cu "confirm", "trimite", "ok", "da") apelează \`create_support_ticket\`.
- NU oferi soluții tehnice. Rolul tău e să colectezi informații și să le transmiți echipei.
- Fii empatic, profesionist, modern.
- Primul mesaj: salut scurt + întreabă cu ce poți ajuta + apelează \`propose_quick_replies\` cu categoriile. Dacă userul e pe pagina unui produs/rezervări, menționează asta natural.

CLASIFICARE PRIORITATE (obligatoriu când chemi create_support_ticket):
- CRITICAL: fraudă, abuz/hărțuire, dispute financiare active mari, KYC blocat de mult timp, pericol pentru user.
- HIGH: nu și-a primit banii înapoi, produsul nu a fost returnat, anulare după începerea închirierii, daune semnificative.
- MEDIUM: probleme cu rezervări viitoare, întrebări concrete despre plată, neconcordanțe minore.
- LOW: întrebări generale, sugestii, clarificări, feedback.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
                  "KYC_REVIEW", "FRAUD_SUSPECTED", "ABUSIVE_BEHAVIOR", "GENERAL_INQUIRY",
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
                  "KYC_REVIEW", "FRAUD_SUSPECTED", "ABUSIVE_BEHAVIOR", "GENERAL_INQUIRY",
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
