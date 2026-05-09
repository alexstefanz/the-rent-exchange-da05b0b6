import { supabase } from "@/integrations/supabase/client";

export type UrlClassification = "SAFE" | "WARNING" | "BLOCKED";

export interface UrlScanResult {
  classification: UrlClassification;
  risk_score: number;
  reasons: string[];
  host: string;
  normalized_url: string;
}

const ALLOWLIST = ["rentli.ro", "rentli.com"];

// Robust URL extraction: matches http(s)://... and bare www. domains
const URL_REGEX = /(https?:\/\/[^\s<>"']+|(?:^|\s)(www\.[^\s<>"']+))/gi;

export function extractUrls(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const match of text.matchAll(URL_REGEX)) {
    const raw = (match[1] || match[2] || "").trim().replace(/[.,;:!?)\]]+$/, "");
    if (raw) found.add(raw);
  }
  return Array.from(found);
}

export function isAllowlistedHost(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWLIST.some((a) => h === a || h.endsWith("." + a));
}

export function getHostFromUrl(url: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : "http://" + url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

const memoryCache = new Map<string, Promise<UrlScanResult>>();

export async function scanUrl(url: string): Promise<UrlScanResult> {
  const host = getHostFromUrl(url);

  // Synchronous shortcut for allowlisted domains
  if (host && isAllowlistedHost(host)) {
    return {
      classification: "SAFE",
      risk_score: 0,
      reasons: ["allowlisted"],
      host,
      normalized_url: url,
    };
  }

  if (memoryCache.has(url)) return memoryCache.get(url)!;

  const promise = (async () => {
    const { data, error } = await supabase.functions.invoke("scan-url", { body: { url } });
    if (error || !data) {
      // Fail-open as WARNING — never silently mark unknown links as SAFE
      return {
        classification: "WARNING" as const,
        risk_score: 30,
        reasons: ["scan_failed"],
        host: host ?? "",
        normalized_url: url,
      };
    }
    return data as UrlScanResult;
  })();

  memoryCache.set(url, promise);
  return promise;
}

export async function reportUrl(url: string, reason?: string, messageId?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("url_reports").insert({
    reporter_id: user.id,
    url,
    host: getHostFromUrl(url),
    reason: reason ?? null,
    message_id: messageId ?? null,
  });
  return !error;
}