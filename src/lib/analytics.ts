// Google Analytics 4 helpers. gtag is installed in index.html with Consent Mode
// defaulting to denied — trackPageview/trackEvent are safe no-ops until the user
// accepts cookies in the banner (which flips analytics_storage to granted).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID = "G-5QNFPSKBSM";

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

export interface ConsentSignals {
  statistics: boolean;
  marketing: boolean;
  preferences: boolean;
}

/** Push a full Google Consent Mode v2 update. */
export function setConsentSignals({ statistics, marketing, preferences }: ConsentSignals) {
  gtag("consent", "update", {
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
    analytics_storage: statistics ? "granted" : "denied",
    functionality_storage: preferences ? "granted" : "denied",
    personalization_storage: preferences ? "granted" : "denied",
    security_storage: "granted",
  });
}

export function setAnalyticsConsent(granted: boolean) {
  gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}

export function trackPageview(path: string, title?: string) {
  // Strip query string / hash — never send tokens or user input to GA.
  const cleanPath = path.split("?")[0].split("#")[0];
  gtag("event", "page_view", {
    page_path: cleanPath,
    page_location: window.location.origin + cleanPath,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  gtag("event", name, params ?? {});
}