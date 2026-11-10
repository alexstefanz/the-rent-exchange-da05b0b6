import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize:
    "Ești asistentul intern al echipei de suport Rentli. Primești un ticket cu mesaje. Răspunde STRICT în română, scurt (max 6 puncte bullet) cu: (1) Problema clientului, (2) Context relevant, (3) Acțiuni deja întreprinse, (4) Ce așteaptă clientul, (5) Risc/prioritate sugerată.",
  suggest_reply:
    "Ești agent senior de suport Rentli. Pe baza conversației existente, redactează un singur răspuns CĂTRE CLIENT, în română, profesionist, empatic, concret, max 4 propoziții. NU semna cu nume. NU adăuga semnătură. Returnează DOAR textul mesajului.",
  suggest_action:
    "Ești supervisor de suport Rentli. Pe baza ticketului, recomandă în română: status nou (NEW/IN_PROGRESS/WAITING_CUSTOMER/WAITING_OWNER/WAITING_INTERNAL/RESOLVED/CLOSED), prioritate (LOW/MEDIUM/HIGH/URGENT) și 1-2 acțiuni concrete. Format: trei rânduri scurte: 'Status: X', 'Prioritate: Y', 'Acțiuni: ...'.",
};

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticketId, mode } = await req.json();
    if (!ticketId || !mode || !SYSTEM_PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ticket + messages
    const { data: ticket } = await admin
      .from("ops_tickets")
      .select("title, description, category_group, category_type, priority, status, created_at")
      .eq("id", ticketId)
      .single();
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: messages } = await admin
      .from("ops_ticket_messages")
      .select("author_type, message_text, is_internal, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    const conversation = (messages || [])
      .filter((m: any) => !m.is_internal)
      .map((m: any) => `[${m.author_type}] ${m.message_text}`)
      .join("\n\n");

    const userPrompt = `TICKET\nTitlu: ${ticket.title}\nCategorie: ${ticket.category_group} / ${ticket.category_type}\nPrioritate curentă: ${ticket.priority}\nStatus curent: ${ticket.status}\nDescriere inițială:\n${ticket.description}\n\nCONVERSAȚIE:\n${conversation || "(nicio conversație încă)"}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode] },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Prea multe cereri. Reîncearcă în câteva secunde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const text = json?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin assist error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));