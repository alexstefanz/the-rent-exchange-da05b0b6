import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface Body {
  title?: string;
  category?: string;
  subcategory?: string;
  condition?: string;
  included_items?: string[];
  usage_rules?: string[];
}

const conditionMap: Record<string, string> = {
  new: "nou, nefolosit",
  very_good: "stare foarte bună",
  good: "stare bună",
  used: "cu urme de utilizare",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const title = (body.title ?? "").trim();
    if (!title || title.length < 3) {
      return new Response(JSON.stringify({ error: "Titlu prea scurt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parts: string[] = [
      `Titlu: ${title}`,
      body.category ? `Categorie: ${body.category}` : "",
      body.subcategory ? `Subcategorie: ${body.subcategory}` : "",
      body.condition ? `Stare: ${conditionMap[body.condition] ?? body.condition}` : "",
      body.included_items?.length ? `Accesorii incluse: ${body.included_items.join(", ")}` : "",
      body.usage_rules?.length ? `Reguli de utilizare: ${body.usage_rules.join(", ")}` : "",
    ].filter(Boolean);

    const systemPrompt = `Ești un copywriter expert pentru anunțurile de închiriere de pe platforma românească Rentli.
Scrii descrieri clare, prietenoase, în limba română, structurate pe 3 paragrafe scurte (~80-100 cuvinte total):
1. Ce este produsul și pentru ce e bun.
2. Ce primește chiriașul (accesorii incluse, stare, dimensiuni dacă rezultă din titlu).
3. Recomandări de utilizare sau condiții.

REGULI STRICTE:
- NU include numere de telefon, emailuri, link-uri sau nume de aplicații (WhatsApp, Telegram, etc).
- NU folosi superlative goale ("cel mai bun", "extraordinar").
- NU promite ce nu rezultă din input.
- Tonul: profesionist, concret, prietenos.
- Maxim 600 caractere total.
- Returnează DOAR descrierea, fără introduceri ("Iată descrierea:") sau formatare markdown.`;

    const userPrompt = parts.join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Prea multe cereri. Încearcă în câteva minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Lovable AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    let description = aiData?.choices?.[0]?.message?.content?.trim() ?? "";
    if (description.length > 600) description = description.slice(0, 600);

    return new Response(JSON.stringify({ description }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-product-description error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});