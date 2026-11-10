import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANAF_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";
const CACHE_TTL_HOURS = 24;

const rateMap = new Map<string, { count: number; ts: number }>();
function rateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > windowMs) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function cleanCui(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.trim().toUpperCase().replace(/^RO/, "").replace(/\s/g, "");
  if (!/^\d{2,10}$/.test(cleaned)) return null;
  return cleaned;
}

interface Normalized {
  found: boolean;
  cui: string;
  denumire: string | null;
  adresa: string | null;
  nrRegCom: string | null;
  scpTVA: boolean;
  statusInactivi: boolean;
  error?: string;
}

function normalize(cui: string, anaf: any): Normalized {
  const dg = anaf?.date_generale ?? {};
  const tva = anaf?.inregistrare_scop_Tva ?? {};
  const inact = anaf?.stare_inactiv ?? {};
  return {
    found: !!dg.cui,
    cui,
    denumire: dg.denumire ?? null,
    adresa: dg.adresa ?? null,
    nrRegCom: dg.nrRegCom ?? null,
    scpTVA: !!tva.scpTVA,
    statusInactivi: !!inact.statusInactivi,
  };
}

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit. Așteaptă un minut." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const cui = cleanCui(body?.cui ?? "");
    if (!cui) {
      return new Response(JSON.stringify({ found: false, error: "CUI invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check cache
    const { data: cached } = await supabase
      .from("anaf_cache")
      .select("data, fetched_at")
      .eq("cui", cui)
      .maybeSingle();

    if (cached) {
      const ageHours = (Date.now() - new Date(cached.fetched_at).getTime()) / 36e5;
      if (ageHours < CACHE_TTL_HOURS) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Query ANAF
    const today = new Date().toISOString().slice(0, 10);
    const anafRes = await fetch(ANAF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Rentli/1.0 (+https://rentli.ro)",
      },
      body: JSON.stringify([{ cui: Number(cui), data: today }]),
    });

    if (!anafRes.ok) {
      const txt = await anafRes.text().catch(() => "");
      console.error("ANAF non-OK", anafRes.status, txt.slice(0, 300));
      return new Response(
        JSON.stringify({ found: false, error: "ANAF indisponibil. Încearcă din nou." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await anafRes.json();
    const entry = json?.found?.[0];
    const result: Normalized = entry
      ? normalize(cui, entry)
      : { found: false, cui, denumire: null, adresa: null, nrRegCom: null, scpTVA: false, statusInactivi: false };

    // 3. Save cache (best-effort)
    await supabase
      .from("anaf_cache")
      .upsert({ cui, data: result, fetched_at: new Date().toISOString() })
      .then(() => {}, () => {});

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-cui error", e);
    return new Response(JSON.stringify({ found: false, error: "Eroare server" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));