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

const TAXONOMY: Array<{ slug: string; subcategories: string[] }> = [
  { slug: "unelte", subcategories: ["1-1", "1-2", "1-3", "1-4", "1-5", "1-99"] },
  { slug: "evenimente", subcategories: ["2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-99"] },
  { slug: "electronice", subcategories: ["3-1", "3-2", "3-3", "3-4", "3-5", "3-6", "3-7", "3-99"] },
  { slug: "gradinarit", subcategories: ["4-1", "4-2", "4-3", "4-4", "4-99"] },
  { slug: "outdoor", subcategories: ["5-1", "5-2", "5-3", "5-4", "5-99"] },
  { slug: "jucarii-petrecere-copii", subcategories: ["6-1", "6-2", "6-3", "6-4", "6-99"] },
  { slug: "sport", subcategories: ["7-1", "7-2", "7-3", "7-4", "7-5", "7-6", "7-99"] },
  { slug: "travel", subcategories: ["8-1", "8-2", "8-3", "8-4", "8-99"] },
  { slug: "transport-utilitare", subcategories: ["9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7", "9-99"] },
  { slug: "haine-recuzita", subcategories: ["10-1", "10-2", "10-3", "10-99"] },
  { slug: "utilaje", subcategories: ["11-1", "11-2", "11-3", "11-4", "11-5", "11-6", "11-7", "11-8", "11-9", "11-10", "11-11", "11-12", "11-13", "11-99"] },
  { slug: "diverse", subcategories: ["12-99"] },
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
    const products: Array<{ slug: string; created_at: string | null }> = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from("products")
        .select("slug, created_at")
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
        // created_at is a per-product timestamp, safe as lastmod
        lastmod: p.created_at ? p.created_at.split("T")[0] : undefined,
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
