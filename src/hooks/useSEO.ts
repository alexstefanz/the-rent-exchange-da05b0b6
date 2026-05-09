import { useEffect } from "react";

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  canonical?: string;
  jsonLd?: Record<string, any> | null;
}

const setMeta = (selector: string, attr: string, value: string) => {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    if (selector.startsWith("link")) {
      el = document.createElement("link");
      const rel = selector.match(/rel="([^"]+)"/)?.[1];
      if (rel) (el as HTMLLinkElement).rel = rel;
    } else {
      el = document.createElement("meta");
      const name = selector.match(/name="([^"]+)"/)?.[1];
      const property = selector.match(/property="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
      if (property) el.setAttribute("property", property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

export const useSEO = ({ title, description, image, url, type = "website", canonical, jsonLd }: SEOConfig) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('meta[name="description"]', "content", description);

    if (title) setMeta('meta[property="og:title"]', "content", title);
    if (description) setMeta('meta[property="og:description"]', "content", description);
    if (image) setMeta('meta[property="og:image"]', "content", image);
    if (url) setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", type);

    setMeta('meta[name="twitter:card"]', "content", image ? "summary_large_image" : "summary");
    if (title) setMeta('meta[name="twitter:title"]', "content", title);
    if (description) setMeta('meta[name="twitter:description"]', "content", description);
    if (image) setMeta('meta[name="twitter:image"]', "content", image);

    if (canonical) setMeta('link[rel="canonical"]', "href", canonical);

    let jsonLdEl = document.getElementById("seo-jsonld") as HTMLScriptElement | null;
    if (jsonLd) {
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.id = "seo-jsonld";
        jsonLdEl.type = "application/ld+json";
        document.head.appendChild(jsonLdEl);
      }
      jsonLdEl.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdEl) {
      jsonLdEl.remove();
    }
  }, [title, description, image, url, type, canonical, JSON.stringify(jsonLd)]);
};