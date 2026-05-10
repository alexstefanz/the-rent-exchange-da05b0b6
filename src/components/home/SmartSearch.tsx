import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, X, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { judete } from "@/data/romaniaLocations";

const RECENT_KEY = "rentli_recent_searches";
const MAX_RECENT = 5;

const TRENDING = [
  { ro: "TV OLED", en: "OLED TV" },
  { ro: "Cort camping", en: "Camping tent" },
  { ro: "Boxă portabilă", en: "Portable speaker" },
  { ro: "Drujbă", en: "Chainsaw" },
  { ro: "Drone", en: "Drone" },
  { ro: "Rulotă", en: "Trailer" },
];

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  if (!q.trim()) return;
  try {
    const cur = loadRecent();
    const next = [q, ...cur.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {/* ignore */}
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

type LocationMatch = { judet: string; localitate?: string; matchedText: string };

function buildLocationIndex() {
  const cities: { norm: string; original: string; judet: string; words: number }[] = [];
  const counties: { norm: string; original: string; words: number }[] = [];
  for (const j of judete) {
    counties.push({ norm: norm(j.name), original: j.name, words: j.name.split(/\s+/).length });
    for (const loc of j.localitati) {
      cities.push({ norm: norm(loc), original: loc, judet: j.name, words: loc.split(/[\s-]+/).length });
    }
  }
  // Longest first so multi-word names win
  cities.sort((a, b) => b.words - a.words || b.norm.length - a.norm.length);
  counties.sort((a, b) => b.words - a.words || b.norm.length - a.norm.length);
  return { cities, counties };
}

function detectLocation(
  query: string,
  index: ReturnType<typeof buildLocationIndex>,
): { match: LocationMatch | null; cleanedQuery: string } {
  const n = ` ${norm(query)} `;
  for (const c of index.cities) {
    const needle = ` ${c.norm} `;
    if (n.includes(needle)) {
      const cleaned = n.replace(needle, " ").replace(/\s+/g, " ").trim();
      return {
        match: { judet: c.judet, localitate: c.original, matchedText: c.original },
        cleanedQuery: cleaned,
      };
    }
  }
  for (const c of index.counties) {
    const needle = ` ${c.norm} `;
    if (n.includes(needle)) {
      const cleaned = n.replace(needle, " ").replace(/\s+/g, " ").trim();
      return {
        match: { judet: c.original, matchedText: c.original },
        cleanedQuery: cleaned,
      };
    }
  }
  return { match: null, cleanedQuery: query.trim() };
}

const SmartSearch = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; slug: string | null; category: string | null }[]>([]);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationIndex = useMemo(buildLocationIndex, []);
  const detected = useMemo(
    () => (query.trim().length >= 2 ? detectLocation(query, locationIndex) : { match: null, cleanedQuery: query }),
    [query, locationIndex],
  );

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const probe = (detected.cleanedQuery || query).trim();
    if (probe.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, category")
        .ilike("title", `%${probe}%`)
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .is("deleted_at", null)
        .limit(6);
      setSuggestions(data || []);
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, detected.cleanedQuery]);

  const submit = (q: string) => {
    pushRecent(q);
    setOpen(false);
    const { match, cleanedQuery } = detectLocation(q, locationIndex);
    const params = new URLSearchParams();
    const finalQ = (cleanedQuery || "").trim();
    if (finalQ) params.set("q", finalQ);
    if (match) {
      params.set("judet", match.judet);
      if (match.localitate) params.set("localitate", match.localitate);
    }
    const qs = params.toString();
    navigate(qs ? `/cauta?${qs}` : `/cauta`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      navigate(`/cauta`);
      return;
    }
    submit(query.trim());
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  const trendingLabels = useMemo(
    () => TRENDING.map((x) => (language === "en" ? x.en : x.ro)),
    [language],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverAnchor asChild>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 p-2"
          >
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                type="text"
                inputMode="search"
                placeholder={t("Ce vrei să închiriezi?", "What do you want to rent?")}
                value={query}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                className="border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label={t("Șterge", "Clear")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#F98715] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t("Caută", "Search")}</span>
            </button>
          </form>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border border-white/10 shadow-2xl bg-black/55 backdrop-blur-xl max-w-[calc(100vw-2rem)]"
          style={{ width: "var(--radix-popover-trigger-width, 100%)" }}
        >
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Location hint */}
            {detected.match && (
              <div className="mb-2 mx-1 flex items-center gap-2 rounded-lg bg-primary/20 px-2.5 py-2 text-xs text-white">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">
                  {t("Caut", "Searching")}{" "}
                  {detected.cleanedQuery && <span className="font-semibold">«{detected.cleanedQuery}» </span>}
                  {t("în", "in")}{" "}
                  <span className="font-semibold">
                    {detected.match.localitate || detected.match.judet}
                  </span>
                </span>
              </div>
            )}

            {/* Live suggestions */}
            {(detected.cleanedQuery || query).trim().length >= 2 && suggestions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {t("Sugestii", "Suggestions")}
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => submit(s.title)}
                    className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Search className="h-4 w-4 text-white/70" />
                    <span className="flex-1 truncate">{s.title}</span>
                    {s.category && (
                      <span className="text-[10px] text-white/60">{s.category}</span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-white/40 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Recent */}
            {recent.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    <Clock className="h-3 w-3" /> {t("Căutări recente", "Recent searches")}
                  </span>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-white/60 hover:text-white"
                  >
                    {t("Șterge", "Clear")}
                  </button>
                </div>
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => submit(r)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="flex-1 truncate">{r}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending */}
            <div>
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 inline-flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" /> {t("În tendințe", "Trending now")}
              </div>
              <div className="flex flex-wrap gap-1.5 px-1.5 pb-1.5">
                {trendingLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => submit(label)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                      "bg-white/10 text-white hover:bg-white/15 transition-all hover:-translate-y-0.5",
                    )}
                  >
                    🔥 {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SmartSearch;