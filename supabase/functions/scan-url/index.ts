import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "cutt.ly", "rb.gy", "s.id", "shorturl.at", "buff.ly", "lnkd.in",
  "tiny.cc", "rebrand.ly", "shorte.st", "adf.ly",
]);

const HIGH_RISK_TLDS = new Set([
  "zip", "mov", "top", "xyz", "click", "country", "work", "gq", "tk", "ml", "cf", "ga",
]);

const PHISHING_KEYWORDS = [
  "login", "verify", "secure", "account", "wallet", "bank", "password",
  "signin", "auth", "confirm", "update", "billing",
];

const KNOWN_BRANDS = [
  "rentli", "google", "paypal", "stripe", "revolut", "ing", "brd", "bcr",
  "emag", "olx", "facebook", "instagram", "apple", "microsoft", "netflix",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function stripZeroWidth(s: string): string {
  return s.replace(/[\u200B-\u200F\uFEFF\u2060]/g, "");
}

function normalizeUrl(raw: string): { normalized: string; host: string; url: URL } | null {
  try {
    let cleaned = stripZeroWidth(raw.trim());
    if (!/^https?:\/\//i.test(cleaned)) cleaned = "http://" + cleaned;
    const u = new URL(cleaned);
    u.hostname = u.hostname.toLowerCase();
    return { normalized: u.toString(), host: u.hostname, url: u };
  } catch {
    return null;
  }
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hostMatchesAllowlist(host: string, allow: Set<string>): boolean {
  if (allow.has(host)) return true;
  for (const a of allow) {
    if (host === a || host.endsWith("." + a)) return true;
  }
  return false;
}

async function checkGSB(url: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "rentli", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.matches?.length > 0) return data.matches[0].threatType ?? "MATCH";
    return null;
  } catch (e) {
    console.error("GSB error:", e);
    return null;
  }
}

function scoreHeuristics(u: URL): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const host = u.hostname;

  if (u.protocol !== "https:") { score += 30; reasons.push("non_https"); }

  if (host.includes("xn--")) {
    reasons.push("punycode");
    const decoded = host.replace(/xn--[a-z0-9-]+/g, "");
    for (const brand of KNOWN_BRANDS) {
      if (levenshtein(decoded.split(".")[0] ?? "", brand) <= 2) {
        score += 25; reasons.push(`brand_lookalike:${brand}`); break;
      }
    }
    if (!reasons.some((r) => r.startsWith("brand_lookalike"))) score += 10;
  }

  const hostNoTld = host.replace(/\.[a-z]+$/, "");
  for (const brand of KNOWN_BRANDS) {
    const dist = levenshtein(hostNoTld.split(".").pop() ?? "", brand);
    if (dist > 0 && dist <= 2) {
      score += 25; reasons.push(`brand_lookalike:${brand}`); break;
    }
  }

  if (SHORTENERS.has(host)) { score += 20; reasons.push("shortener"); }

  const subCount = host.split(".").length - 2;
  if (subCount > 4) { score += 15; reasons.push("excessive_subdomains"); }

  if (/[@]/.test(host) || /--/.test(host)) { score += 15; reasons.push("suspicious_chars"); }

  const tld = host.split(".").pop() ?? "";
  if (HIGH_RISK_TLDS.has(tld)) { score += 10; reasons.push(`high_risk_tld:${tld}`); }

  const pq = (u.pathname + u.search).toLowerCase();
  for (const kw of PHISHING_KEYWORDS) {
    if (pq.includes(kw)) { score += 10; reasons.push(`phishing_keyword:${kw}`); break; }
  }

  if (/\d{1,3}(\.\d{1,3}){3}/.test(host)) { score += 20; reasons.push("ip_address_host"); }

  return { score: Math.min(score, 100), reasons };
}

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
      return new Response(JSON.stringify({ error: "Invalid url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const norm = normalizeUrl(url);
    if (!norm) {
      return new Response(JSON.stringify({ error: "Cannot parse url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Allowlist
    const { data: allowRows } = await supabase.from("url_allowlist").select("host");
    const allowSet = new Set((allowRows ?? []).map((r: any) => r.host.toLowerCase()));
    if (hostMatchesAllowlist(norm.host, allowSet)) {
      return new Response(JSON.stringify({
        classification: "SAFE", risk_score: 0, reasons: ["allowlisted"],
        host: norm.host, normalized_url: norm.normalized,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hash = await sha256(norm.normalized);

    // Cache lookup
    const { data: cached } = await supabase
      .from("url_scan_cache")
      .select("*")
      .eq("url_hash", hash)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(JSON.stringify({
        classification: cached.classification,
        risk_score: cached.risk_score,
        reasons: cached.reasons,
        host: cached.host,
        normalized_url: cached.normalized_url,
        cached: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Heuristic scoring
    const { score, reasons } = scoreHeuristics(norm.url);
    let finalScore = score;
    let gsbThreat: string | null = null;

    const gsbKey = Deno.env.get("GOOGLE_SAFE_BROWSING_API_KEY");
    if (gsbKey) {
      gsbThreat = await checkGSB(norm.normalized, gsbKey);
      if (gsbThreat) { finalScore += 70; reasons.push(`gsb:${gsbThreat}`); }
    }
    finalScore = Math.min(finalScore, 100);

    let classification: "SAFE" | "WARNING" | "BLOCKED" = "SAFE";
    if (gsbThreat || finalScore >= 70) classification = "BLOCKED";
    else if (finalScore >= 30) classification = "WARNING";

    const ttlDays = classification === "SAFE" ? 7 : 1;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("url_scan_cache").upsert({
      url_hash: hash,
      normalized_url: norm.normalized,
      host: norm.host,
      classification,
      risk_score: finalScore,
      reasons,
      gsb_threat: gsbThreat,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      classification, risk_score: finalScore, reasons,
      host: norm.host, normalized_url: norm.normalized, cached: false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("scan-url error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));