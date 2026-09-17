import { useLocation } from "react-router-dom";
import { useSEO } from "./useSEO";

/** The single official host used for canonical URLs (no www, no preview domains). */
export const CANONICAL_ORIGIN = "https://rentli.ro";

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
  // Canonical always points at the single official host, never www/preview.
  const url = `${CANONICAL_ORIGIN}${pathname}`;
  useSEO({ title, description, image, url, canonical: url, type, jsonLd, noindex });
};