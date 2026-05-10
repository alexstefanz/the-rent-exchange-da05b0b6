import { useEffect, useState } from "react";
import { Grid3X3, List, Map, MapPin, Locate, Filter, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export interface QuickFilters {
  verifiedOnly: boolean;
  underFifty: boolean;
  underHundred: boolean;
  city: string | null; // matches product.location_city
}

interface Props {
  filters: QuickFilters;
  onChange: (next: QuickFilters) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  viewMode: "gallery" | "list";
  onViewChange: (v: "gallery" | "list") => void;
  onOpenMobileFilters: () => void;
  activeCount: number;
  resultCount: number;
}

const QUICK_CITIES = ["București", "Cluj-Napoca", "Iași", "Timișoara"];

const StickyFilterBar = ({
  filters, onChange, sortBy, onSortChange, viewMode, onViewChange,
  onOpenMobileFilters, activeCount, resultCount,
}: Props) => {
  const { t } = useLanguage();
  const [stuck, setStuck] = useState(false);

  // Watch a sentinel to apply elevated style only when sticky-engaged
  useEffect(() => {
    const sentinel = document.getElementById("category-sentinel");
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      { rootMargin: "-65px 0px 0px 0px", threshold: 0 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  const setNearMe = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => { /* For now, rely on chip-cities. Reverse-geocode left as future work. */ },
      () => {},
    );
    // No exact reverse-geocode without external API; cycle to "all" if currently set
    onChange({ ...filters, city: filters.city === "near" ? null : "near" });
  };

  const Chip = ({
    active, onClick, children, ariaLabel,
  }: { active: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-xs font-medium transition-all duration-200 ring-1 whitespace-nowrap",
        active
          ? "bg-primary/15 text-primary ring-primary/30 motion-safe:animate-ring-pulse"
          : "bg-card text-foreground ring-border/60 hover:ring-foreground/40",
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        "sticky top-16 z-30 -mx-4 md:mx-0 px-4 md:px-0 py-3 transition-all duration-200",
        stuck && "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-sm",
      )}
    >
      <div className="flex items-center gap-2">
        {/* Mobile: filter button + count */}
        <button
          onClick={onOpenMobileFilters}
          className="md:hidden inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-xs font-medium bg-foreground text-background"
        >
          <Filter className="h-3.5 w-3.5" />
          {t("Filtre", "Filters")}
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px]">
              {activeCount}
            </span>
          )}
        </button>

        {/* Desktop chips */}
        <div className="hidden md:flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
          <Chip
            active={filters.verifiedOnly}
            onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          >
            <Check className="h-3.5 w-3.5" /> {t("Utilizatori verificați", "Verified users")}
          </Chip>
          <Chip
            active={filters.underFifty}
            onClick={() => onChange({ ...filters, underFifty: !filters.underFifty, underHundred: false })}
          >
            {t("Sub 50 RON/zi", "Under 50 RON/day")}
          </Chip>
          <Chip
            active={filters.underHundred}
            onClick={() => onChange({ ...filters, underHundred: !filters.underHundred, underFifty: false })}
          >
            {t("Sub 100 RON/zi", "Under 100 RON/day")}
          </Chip>

          <span className="mx-1 h-5 w-px bg-border" />

          <Chip
            active={filters.city === "near"}
            onClick={setNearMe}
            ariaLabel="Aproape de mine"
          >
            <Locate className="h-3.5 w-3.5" /> {t("Aproape de mine", "Near me")}
          </Chip>
          {QUICK_CITIES.map((c) => (
            <Chip
              key={c}
              active={filters.city === c}
              onClick={() => onChange({ ...filters, city: filters.city === c ? null : c })}
            >
              <MapPin className="h-3.5 w-3.5" /> {c}
            </Chip>
          ))}
        </div>

        {/* Right side: count + sort + view */}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">
            {t(`${resultCount} rezultate`, `${resultCount} results`)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-full text-xs">
                {t("Sortare", "Sort")}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => onSortChange("relevance")}>
                {t("Relevanță", "Relevance")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("newest")}>
                {t("Cele mai noi", "Newest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("price_asc")}>
                {t("Preț crescător", "Price ascending")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("price_desc")}>
                {t("Preț descrescător", "Price descending")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View switcher */}
          <div className="hidden sm:flex items-center rounded-full border border-border bg-card p-1">
            <button
              onClick={() => onViewChange("gallery")}
              className={cn("h-7 w-7 rounded-full inline-flex items-center justify-center transition-colors",
                viewMode === "gallery" ? "bg-foreground text-background" : "text-muted-foreground")}
              aria-label="Grid"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={cn("h-7 w-7 rounded-full inline-flex items-center justify-center transition-colors",
                viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground")}
              aria-label="List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled
                    className="h-7 w-7 rounded-full inline-flex items-center justify-center text-muted-foreground/50 cursor-not-allowed"
                    aria-label="Map"
                  >
                    <Map className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("În curând", "Coming soon")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyFilterBar;
