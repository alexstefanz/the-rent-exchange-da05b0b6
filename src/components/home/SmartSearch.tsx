import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, X, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

const SmartSearch = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; slug: string | null; category: string | null }[]>([]);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, category")
        .ilike("title", `%${query}%`)
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .is("deleted_at", null)
        .limit(6);
      setSuggestions(data || []);
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const submit = (q: string) => {
    pushRecent(q);
    setOpen(false);
    navigate(`/cauta?q=${encodeURIComponent(q)}`);
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
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
          className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-border/70 shadow-2xl bg-background/98 backdrop-blur-xl max-w-[calc(100vw-2rem)]"
          style={{ width: "var(--radix-popover-trigger-width, 100%)" }}
        >
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Live suggestions */}
            {query.trim().length >= 2 && suggestions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("Sugestii", "Suggestions")}
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => submit(s.title)}
                    className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-primary/5 transition-colors text-left"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{s.title}</span>
                    {s.category && (
                      <span className="text-[10px] text-muted-foreground">{s.category}</span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Recent */}
            {query.trim().length < 2 && recent.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3 w-3" /> {t("Căutări recente", "Recent searches")}
                  </span>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {t("Șterge", "Clear")}
                  </button>
                </div>
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => submit(r)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-primary/5 transition-colors text-left"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{r}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending */}
            <div>
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" /> {t("În tendințe", "Trending now")}
              </div>
              <div className="flex flex-wrap gap-1.5 px-1.5 pb-1.5">
                {trendingLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => submit(label)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                      "bg-primary/10 text-primary hover:bg-primary/15 transition-all hover:-translate-y-0.5",
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