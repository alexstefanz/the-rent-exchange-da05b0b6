import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { expandSearchTerms } from "@/lib/searchSynonyms";

/** Lowercase + strip Romanian diacritics so "cort" matches "Corț"/"corturi". */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP_WORDS = new Set([
  "de", "la", "cu", "si", "sau", "un", "o", "in", "pe", "pentru", "din", "the", "and",
  "inchiriere", "inchiriez", "inchiriat", "rent", "rental", "noi", "nou", "noua",
]);

/** Classic Levenshtein distance, capped implicitly by short inputs. */
const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
};

interface TitleRow {
  title: string | null;
  title_en?: string | null;
  category: string | null;
}

/** Titles of all active listings, used to propose alternative keywords. */
const useAllListingTitles = (enabled: boolean) =>
  useQuery<TitleRow[]>({
    queryKey: ["search-suggestion-corpus"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("search_products", {
        _search: null,
        _search_terms: null,
        _category: null,
        _subcategory: null,
        _location_city: null,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((p) => ({
        title: p.title ?? null,
        title_en: p.title_en ?? null,
        category: p.category ?? null,
      }));
    },
  });

/**
 * Suggests up to `limit` clickable keywords when a search returns nothing.
 * Falls back to the most common categories when nothing looks similar.
 */
export const useSearchSuggestions = (query: string, enabled: boolean, limit = 6) => {
  const { data: corpus = [] } = useAllListingTitles(enabled);

  return useMemo(() => {
    if (!enabled) return [] as string[];

    const wordCounts = new Map<string, { display: string; count: number }>();
    const categoryCounts = new Map<string, number>();

    for (const row of corpus) {
      if (row.category) {
        categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
      }
      for (const raw of [row.title, row.title_en]) {
        if (!raw) continue;
        for (const word of normalize(raw).split(" ")) {
          if (word.length < 3 || STOP_WORDS.has(word)) continue;
          const entry = wordCounts.get(word);
          if (entry) entry.count += 1;
          else wordCounts.set(word, { display: word, count: 1 });
        }
      }
    }

    const q = normalize(query);
    if (!q) return [];

    // Include synonyms of the query so "tv" can point at "televizor".
    const queryVariants = Array.from(
      new Set([q, ...expandSearchTerms(query).map(normalize)].filter(Boolean)),
    );

    const scored: { word: string; score: number; count: number }[] = [];
    for (const [word, { count }] of wordCounts) {
      let best = Infinity;
      for (const variant of queryVariants) {
        if (word === variant) { best = -1; break; }
        if (word.startsWith(variant) || variant.startsWith(word)) {
          best = Math.min(best, 0.5);
          continue;
        }
        if (word.includes(variant) || variant.includes(word)) {
          best = Math.min(best, 1);
          continue;
        }
        const d = levenshtein(word, variant);
        const tolerance = variant.length <= 4 ? 1 : variant.length <= 7 ? 2 : 3;
        if (d <= tolerance) best = Math.min(best, d);
      }
      if (best !== Infinity && best >= 0) scored.push({ word, score: best, count });
    }

    scored.sort((a, b) => a.score - b.score || b.count - a.count);
    const suggestions = scored.slice(0, limit).map((s) => s.word);

    if (suggestions.length > 0) return suggestions;

    // Nothing similar — fall back to the categories with the most listings.
    return [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }, [corpus, query, enabled, limit]);
};
