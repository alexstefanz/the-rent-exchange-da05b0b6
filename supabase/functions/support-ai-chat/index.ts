import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ești asistentul virtual al platformei Rentli, o platformă de închiriere de obiecte între persoane fizice din România.

REGULI:
- Răspunde DOAR în limba română, scurt și prietenos.
- Scopul tău este să afli ce problemă are utilizatorul și să colectezi informațiile necesare pentru a crea un ticket de suport.
- Pune MAXIMUM 2-3 întrebări scurte, una câte una.
- Întreabă mai întâi despre ce categorie de problemă e vorba (rezervare, produs, plată, cont, altceva).
- Apoi cere detalii specifice despre problemă.
- Când ai suficiente informații (categorie + descriere clară a problemei), folosește funcția create_support_ticket pentru a crea ticketul.
- NU oferi soluții tehnice. Rolul tău e doar să colectezi informații și să le transmiți echipei.
- Fii empatic și asigură utilizatorul că echipa va rezolva problema.
- Primul mesaj trebuie să fie un salut scurt și să întrebi cu ce poți ajuta.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "create_support_ticket",
          description:
            "Creates a support ticket when you have gathered enough information from the user. Call this when you know the category and have a clear description of the problem.",
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
            },
            required: ["subject", "description", "category_group", "category_type"],
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
            { role: "system", content: SYSTEM_PROMPT },
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
