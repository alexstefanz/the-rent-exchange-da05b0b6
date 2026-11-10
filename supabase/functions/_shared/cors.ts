// Centralised CORS policy for all edge functions.
// Never answers with "*": the request Origin is echoed back only when it is on
// the allow-list (Rentli domains, Lovable previews, local dev, mobile shells).
// Extra origins can be added via the ALLOWED_ORIGINS env var (comma separated).

export const PRIMARY_ORIGIN = "https://rentli.ro";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?rentli\.ro$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^capacitor:\/\/localhost$/,
  /^https:\/\/localhost$/,
];

function extraOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (extraOrigins().includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
}

export function resolveAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  return origin && isAllowedOrigin(origin) ? origin : PRIMARY_ORIGIN;
}

export const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };
}

type Handler = (req: Request, info?: unknown) => Response | Promise<Response>;

/**
 * Wrap a serve handler so every response (including errors and OPTIONS) carries
 * the per-request, allow-listed CORS headers. Overrides any static value the
 * handler set.
 */
export function withCors(handler: Handler, methods = "POST, OPTIONS"): Handler {
  return async (req: Request, info?: unknown) => {
    const res = await handler(req, info);
    const cors = getCorsHeaders(req, methods);
    try {
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch {
      // Immutable headers (e.g. Response.redirect) — rebuild the response.
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(cors)) headers.set(k, v);
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }
  };
}
