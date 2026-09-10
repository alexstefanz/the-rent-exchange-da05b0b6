// Cookiebot consent helpers. Cookiebot is loaded in index.html and syncs
// Google Consent Mode v2. These helpers gate our own client-side storage
// (statistics / preferences) so nothing is written before consent.

export type ConsentCategory = "necessary" | "preferences" | "statistics" | "marketing";

export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  if (typeof window === "undefined") return false;
  const consent = window.Cookiebot?.consent;
  if (!consent) return false;
  return Boolean(consent[category]);
}

/** Subscribe to consent changes (fired from index.html after Cookiebot events). */
export function onConsentChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const events = ["rentli-consent-change", "CookiebotOnAccept", "CookiebotOnDecline", "CookiebotOnLoad"];
  events.forEach((e) => window.addEventListener(e, handler));
  return () => events.forEach((e) => window.removeEventListener(e, handler));
}

/** Remove stored keys when the matching consent category is not (or no longer) granted. */
export function purgeIfNoConsent(category: ConsentCategory, keys: string[]) {
  if (hasConsent(category)) return;
  try {
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage unavailable */
  }
}
