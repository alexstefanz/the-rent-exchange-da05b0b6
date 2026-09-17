import { createClient } from "npm:@supabase/supabase-js@2";

const BASE_URL = "https://rentli.ro";

const STATIC_ENTRIES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categorii", changefreq: "weekly", priority: "0.9" },
  { path: "/cauta", changefreq: "daily", priority: "0.8" },
  { path: "/cum-functioneaza", changefreq: "monthly", priority: "0.7" },
  { path: "/despre-noi", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/centru-asistenta", changefreq: "monthly", priority: "0.5" },
  { path: "/intrebari-frecvente", changefreq: "monthly", priority: "0.5" },
  { path: "/termeni-si-conditii", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-confidentialitate", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-anulare", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-cookies", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderUrl(e: { path: string; changefreq?: string; priority?: string; lastmod?: string }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const entries: Array<{ path: string; changefreq?: string; priority?: string; lastmod?: string }> = [
      ...STATIC_ENTRIES,
    ];

    // Categories + subcategories (taxonomy mirrors src/data/categories.ts)
    for (const c of TAXONOMY) {
      entries.push({ path: `/categorie/${c.slug}`, changefreq: "weekly", priority: "0.8" });
      for (const sub of c.subcategories) {
        entries.push({ path: `/subcategorie/${sub}`, changefreq: "weekly", priority: "0.6" });
      }
    }

    // Approved, active, non-deleted products
    const products: Array<{ slug: string; updated_at: string | null }> = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from("products")
        .select("slug, updated_at")
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null)
        .not("slug", "is", null)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      products.push(...(data as any[]));
      if (data.length < PAGE) break;
    }

    for (const p of products) {
      entries.push({
        path: `/produs/${p.slug}`,
        changefreq: "weekly",
        priority: "0.7",
        // updated_at is a per-product content timestamp, safe as lastmod
        lastmod: p.updated_at ? p.updated_at.split("T")[0] : undefined,
      });
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map(renderUrl),
      "</urlset>",
    ].join("\n");

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("[sitemap] error", e);
    return new Response("sitemap unavailable", { status: 500 });
  }
});
