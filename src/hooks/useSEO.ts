import { useEffect } from "react";

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: "website" | "product" | "article";
  canonical?: string;
  jsonLd?: Record<string, any> | null;
  noindex?: boolean;
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

const DEFAULT_OG_IMAGE = "https://rentli.ro/og-image.webp";

export const useSEO = ({ title, description, image, imageAlt, url, type = "website", canonical, jsonLd, noindex }: SEOConfig) => {
  useEffect(() => {
    const selectedImage = image || DEFAULT_OG_IMAGE;
    const resolvedImage = selectedImage.startsWith("http")
      ? selectedImage
      : new URL(selectedImage, "https://rentli.ro").href;
    if (title) document.title = title;
    if (description) setMeta('meta[name="description"]', "content", description);

    if (title) setMeta('meta[property="og:title"]', "content", title);
    if (description) setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:image"]', "content", resolvedImage);
    if (imageAlt) setMeta('meta[property="og:image:alt"]', "content", imageAlt);
    if (url) setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", type);

    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    if (title) setMeta('meta[name="twitter:title"]', "content", title);
    if (description) setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", resolvedImage);
    if (imageAlt) setMeta('meta[name="twitter:image:alt"]', "content", imageAlt);

    if (canonical) setMeta('link[rel="canonical"]', "href", canonical);

    // robots: only manage when noindex is explicitly requested; otherwise clean up.
    const robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"][data-seo="dynamic"]');
    if (noindex) {
      if (robotsEl) {
        robotsEl.setAttribute("content", "noindex,follow");
      } else {
        const el = document.createElement("meta");
        el.setAttribute("name", "robots");
        el.setAttribute("content", "noindex,follow");
        el.setAttribute("data-seo", "dynamic");
        document.head.appendChild(el);
      }
    } else if (robotsEl) {
      robotsEl.remove();
    }

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
  }, [title, description, image, imageAlt, url, type, canonical, JSON.stringify(jsonLd), noindex]);
};