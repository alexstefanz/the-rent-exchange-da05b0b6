// Global platform configuration for edge functions.
// Override via env (PUBLIC_SITE_URL) without touching code.

/** Full site URL, e.g. https://rentli.ro (no trailing slash). */
export const SITE_URL = (Deno.env.get("PUBLIC_SITE_URL") || "https://rentli.ro").replace(/\/+$/, "");

/** Short host form used in SMS bodies, e.g. rentli.ro */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Central map of app routes used in links (emails, SMS, notifications). */
export const ROUTES = {
  ownerRentals: "/inchirieri",
  renterRentals: "/rezervari",
  messages: "/mesaje",
  profile: "/profil",
  verification: "/verificare",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Build a link. `short` = host-only form (for SMS character budget). */
export function buildLink(
  route: RouteKey,
  params?: Record<string, string | null | undefined>,
  short = false,
): string {
  const base = (short ? SITE_HOST : SITE_URL) + ROUTES[route];
  const qs = Object.entries(params || {})
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${base}?${qs}` : base;
}
