// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { categories } from "../src/data/categories";

const BASE_URL = "https://rentli.ro";
const SUPABASE_URL = "https://tsffyecastudajmgrckt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZmZ5ZWNhc3R1ZGFqbWdyY2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDA0NzIsImV4cCI6MjA4MjcxNjQ3Mn0.pdlhN1E_CWT2SQMWllEm349kxqfkGwzs30R41Jnofw4";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categorii", changefreq: "weekly", priority: "0.9" },
  { path: "/cauta", changefreq: "daily", priority: "0.8" },
  { path: "/cum-functioneaza", changefreq: "monthly", priority: "0.7" },
  { path: "/despre-noi", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/intrebari-frecvente", changefreq: "monthly", priority: "0.5" },
  { path: "/termeni-si-conditii", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-confidentialitate", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-anulare", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-cookies", changefreq: "yearly", priority: "0.3" },
];

async function fetchProducts(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/products?select=slug,created_at&approval_status=eq.approved&is_active=eq.true&deleted_at=is.null&slug=not.is.null`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] products fetch failed: ${res.status}`);
      return [];
    }
    const rows: Array<{ slug: string | null; created_at?: string }> = await res.json();
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        path: `/produs/${r.slug}`,
        lastmod: r.created_at ? r.created_at.split("T")[0] : undefined,
        changefreq: "weekly" as const,
        priority: "0.7",
      }));
  } catch (e) {
    console.warn(`[sitemap] products fetch error`, e);
    return [];
  }
}

function categoryEntries(): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const c of categories) {
    out.push({ path: `/categorie/${c.slug}`, changefreq: "weekly", priority: "0.8" });
    for (const s of c.subcategories) {
      out.push({ path: `/subcategorie/${s.id}`, changefreq: "weekly", priority: "0.6" });
    }
  }
  return out;
}

function render(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const products = await fetchProducts();
  const entries = [...staticEntries, ...categoryEntries(), ...products];
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`sitemap.xml written (${entries.length} entries; ${products.length} products)`);
})();