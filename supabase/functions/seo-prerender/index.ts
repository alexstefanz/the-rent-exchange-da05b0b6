import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
// Serves crawler-ready HTML (correct <title>, description, og:* and JSON-LD)
// for /produs/*, /categorie/* and /subcategorie/*.
// Human visitors keep getting the normal SPA — the web server only routes
// known crawler user-agents here.
import { createClient } from "npm:@supabase/supabase-js@2";
import taxonomy from "./taxonomy.json" with { type: "json" };

const SITE = "https://rentli.ro";
const DEFAULT_IMAGE = `${SITE}/og-image.jpg?v=2`;
const TITLE_MAX = 60;
const DESC_MAX = 155;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const norm = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

function truncate(raw: string | null | undefined, max: number) {
  const text = norm(raw);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return `${base.replace(/[\s,;:.–—-]+$/, "")}…`;
}

function firstValidImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const image = images.find(
    (value): value is string => typeof value === "string" && Boolean(value) && !value.includes("placeholder"),
  );
  if (!image) return null;
  return image.startsWith("http") ? image : `${SITE}${image}`;
}

async function getCollectionProductImage(category: string, subcategory?: string): Promise<string | null> {
  let query = admin
    .from("products")
    .select("images")
    .eq("category", category)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(12);
  if (subcategory) query = query.eq("subcategory", subcategory);
  const { data } = await query;
  for (const product of data || []) {
    const image = firstValidImage(product.images);
    if (image) return image;
  }
  return null;
}

interface Meta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  type: "website" | "product";
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

function renderHtml(base: string, meta: Meta) {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    `<link rel="canonical" href="${esc(meta.canonical)}">`,
    meta.noindex
      ? `<meta name="robots" content="noindex, nofollow">`
      : `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(meta.canonical)}">`,
    `<meta property="og:image" content="${esc(meta.image)}">`,
    `<meta property="og:image:alt" content="${esc(meta.imageAlt)}">`,
    `<meta property="og:type" content="${meta.type}">`,
    `<meta property="og:site_name" content="Rentli">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${esc(meta.image)}">`,
    `<meta name="twitter:image:alt" content="${esc(meta.imageAlt)}">`,
    meta.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  // Strip the shell's generic head tags so crawlers see only the page-specific ones.
  let html = base
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");

  html = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${tags}`);
  return html;
}

let shellCache: { html: string; at: number } | null = null;

async function getShell(): Promise<string> {
  const now = Date.now();
  if (shellCache && now - shellCache.at < 10 * 60 * 1000) return shellCache.html;
  const res = await fetch(`${SITE}/index.html`, { headers: { "User-Agent": "rentli-seo-prerender" } });
  if (!res.ok) throw new Error(`shell fetch failed: ${res.status}`);
  const html = await res.text();
  shellCache = { html, at: now };
  return html;
}

async function categoryMeta(slug: string): Promise<Meta | null> {
  const c = (taxonomy as any).categories[slug];
  if (!c) return null;
  const url = `${SITE}/categorie/${slug}`;
  const title = truncate(`Închiriere ${c.titleKeyword} în România`, TITLE_MAX - 9) + " | Rentli";
  const description = truncate(
    c.description ||
      `Închiriază ${c.name.toLowerCase()} de la oameni verificați. Prețuri corecte, plată securizată, predare cu poze pe Rentli.`,
    DESC_MAX,
  );
  const image = await getCollectionProductImage(c.name) || c.image || DEFAULT_IMAGE;
  return {
    title,
    description,
    canonical: url,
    image,
    imageAlt: `Produse din categoria ${c.name} disponibile pentru închiriere`,
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: c.name,
      url,
      description,
      primaryImageOfPage: {
        "@type": "ImageObject",
        contentUrl: image,
        caption: c.name,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Categorii", item: `${SITE}/categorii` },
          { "@type": "ListItem", position: 3, name: c.name, item: url },
        ],
      },
    },
  };
}

async function subcategoryMeta(id: string): Promise<Meta | null> {
  const s = (taxonomy as any).subcategories[id];
  if (!s) return null;
  const url = `${SITE}/subcategorie/${id}`;
  const title = truncate(`Închiriere ${s.name} — ${s.category}`, TITLE_MAX - 9) + " | Rentli";
  const description = truncate(
    `${s.description}. Închiriază ${s.name.toLowerCase()} de la oameni verificați din România: plată securizată și predare documentată cu poze.`,
    DESC_MAX,
  );
  const image = await getCollectionProductImage(s.category, id) || s.image || DEFAULT_IMAGE;
  return {
    title,
    description,
    canonical: url,
    image,
    imageAlt: `${s.name} disponibile pentru închiriere`,
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: s.name,
      url,
      description,
      primaryImageOfPage: {
        "@type": "ImageObject",
        contentUrl: image,
        caption: s.name,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Categorii", item: `${SITE}/categorii` },
          { "@type": "ListItem", position: 3, name: s.category, item: `${SITE}/categorie/${s.categorySlug}` },
          { "@type": "ListItem", position: 4, name: s.name, item: url },
        ],
      },
    },
  };
}

async function productMeta(slug: string): Promise<Meta | null> {
  const { data } = await admin
    .from("products")
    .select("id, title, description, daily_price_owner, location_city, images, category, condition, slug, is_active, approval_status, deleted_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  const available = data.is_active && data.approval_status === "approved" && !data.deleted_at;
  const url = `${SITE}/produs/${data.slug}`;
  const city = data.location_city || "România";
  const price = Math.round(Number(data.daily_price_owner) || 0);
  const images: string[] = Array.isArray(data.images)
    ? data.images.filter((value: unknown): value is string => typeof value === "string" && Boolean(value) && !value.includes("placeholder"))
    : [];
  const image = images[0]?.startsWith("http") ? images[0] : images[0] ? `${SITE}${images[0]}` : DEFAULT_IMAGE;

  const title = truncate(`Închiriere ${data.title} în ${city} — ${price} lei/zi`, TITLE_MAX - 9) + " | Rentli";
  const lead = `${data.title} de închiriat în ${city}, ${price} lei/zi.`;
  const body = norm(data.description);
  const description = truncate(
    `${lead} ${body.length >= 40 ? body : "Plată securizată, predare documentată cu poze și proprietari verificați pe Rentli."}`,
    DESC_MAX,
  );

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  return {
    title,
    description,
    canonical: url,
    image,
    imageAlt: data.title,
    type: "product",
    noindex: !available,
    jsonLd: available
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: data.title,
          description,
          sku: data.id,
          image: images.map((i) => (i.startsWith("http") ? i : `${SITE}${i}`)),
          brand: { "@type": "Brand", name: "Rentli" },
          category: data.category || undefined,
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "RON",
            priceValidUntil,
            availability: "https://schema.org/InStock",
            url,
            areaServed: { "@type": "Place", name: city },
          },
        }
      : null,
  };
}

Deno.serve(withCors(async (req) => {
  try {
    const reqUrl = new URL(req.url);
    // Nginx forwards the original path either as ?path=... or as the request path.
    const rawPath = reqUrl.searchParams.get("path") || reqUrl.pathname.replace(/^\/seo-prerender/, "");
    const path = decodeURIComponent(rawPath.split("?")[0]).replace(/\/+$/, "") || "/";

    let meta: Meta | null = null;
    let status = 200;

    const product = path.match(/^\/produs\/([^/]+)$/);
    const category = path.match(/^\/categorie\/([^/]+)$/);
    const subcategory = path.match(/^\/subcategorie\/([^/]+)$/);

    if (product) meta = await productMeta(product[1]);
    else if (category) meta = await categoryMeta(category[1]);
    else if (subcategory) meta = await subcategoryMeta(subcategory[1]);

    if (!meta) {
      status = 404;
      meta = {
        title: "Pagină inexistentă | Rentli",
        description: "Anunțul sau pagina căutată nu mai este disponibilă pe Rentli.",
        canonical: `${SITE}${path}`,
        image: DEFAULT_IMAGE,
        imageAlt: "Rentli",
        type: "website",
        noindex: true,
      };
    }

    const shell = await getShell();
    return new Response(renderHtml(shell, meta), {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600",
        "X-Robots-Tag": meta.noindex ? "noindex" : "all",
      },
    });
  } catch (e) {
    console.error("[seo-prerender] error", e);
    // Never block a crawler: fall back to the plain SPA shell.
    try {
      const shell = await getShell();
      return new Response(shell, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    } catch {
      return new Response("unavailable", { status: 500 });
    }
  }
}, "GET, POST, OPTIONS"));
