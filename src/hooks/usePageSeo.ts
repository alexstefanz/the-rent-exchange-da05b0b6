import { useLocation } from "react-router-dom";
import { useSEO } from "./useSEO";

interface PageSeoOptions {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "product" | "article";
  jsonLd?: Record<string, any> | null;
  noindex?: boolean;
}

/**
 * Wrapper around useSEO that automatically sets canonical + og:url
 * to the current absolute URL (origin + pathname).
 */
export const usePageSeo = ({ title, description, image, type = "website", jsonLd, noindex }: PageSeoOptions) => {
  const { pathname } = useLocation();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://rentli.ro";
  const url = `${origin}${pathname}`;
  useSEO({ title, description, image, url, canonical: url, type, jsonLd, noindex });
};