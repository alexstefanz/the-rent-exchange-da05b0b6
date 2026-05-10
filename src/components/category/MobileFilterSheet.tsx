import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { judete } from "@/data/romaniaLocations";
import type { QuickFilters } from "./StickyFilterBar";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  // local filter state (controlled by parent)
  priceRange: [number, number];
  onPriceChange: (v: [number, number]) => void;
  filters: QuickFilters;
  onFiltersChange: (f: QuickFilters) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  resultCount: number;
  onReset: () => void;
}

const MobileFilterSheet = ({
  open, onOpenChange,
  priceRange, onPriceChange,
  filters, onFiltersChange,
  sortBy, onSortChange,
  resultCount, onReset,
}: Props) => {
  const { t } = useLanguage();

  const ToggleRow = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border px-4 h-12 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
      )}
    >
      {children}
      <span className={cn("h-5 w-5 rounded-full border-2 transition-colors", active ? "border-primary bg-primary" : "border-border")} />
    </button>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] flex flex-col">
        <DrawerTitle className="sr-only">{t("Filtre", "Filters")}</DrawerTitle>
        <div className="px-4 pt-2 pb-3 border-b">
          <h2 className="text-lg font-heading font-semibold text-foreground">{t("Filtre", "Filters")}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
          {/* Trust toggles */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Încredere", "Trust")}
            </h3>
            <ToggleRow
              active={filters.verifiedOnly}
              onClick={() => onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
            >
              {t("Doar utilizatori verificați", "Verified users only")}
            </ToggleRow>
          </section>

          {/* Price */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Preț pe zi", "Price per day")}
            </h3>
            <div className="px-1 pt-2">
              <Slider
                value={priceRange}
                onValueChange={(v) => onPriceChange(v as [number, number])}
                max={1000}
                min={0}
                step={10}
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium tabular-nums">{priceRange[0]} RON</span>
                <span className="font-medium tabular-nums">{priceRange[1]} RON</span>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Locație", "Location")}
            </h3>
            <Select
              value={filters.city || "all"}
              onValueChange={(v) => onFiltersChange({ ...filters, city: v === "all" ? null : v })}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder={t("Toate orașele", "All cities")} />
              </SelectTrigger>
              <SelectContent className="max-h-[40vh]">
                <SelectItem value="all">{t("Toate orașele", "All cities")}</SelectItem>
                {judete.flatMap((j) => j.localitati).slice(0, 80).map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Sort */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Sortare", "Sort")}
            </h3>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t("Relevanță", "Relevance")}</SelectItem>
                <SelectItem value="newest">{t("Cele mai noi", "Newest")}</SelectItem>
                <SelectItem value="price_asc">{t("Preț crescător", "Price ascending")}</SelectItem>
                <SelectItem value="price_desc">{t("Preț descrescător", "Price descending")}</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="border-t bg-background p-3 flex items-center gap-3">
          <Button variant="ghost" onClick={onReset} className="flex-1 h-12 rounded-xl">
            {t("Resetează", "Reset")}
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-[2] h-12 rounded-xl">
            {t(`Arată ${resultCount} rezultate`, `Show ${resultCount} results`)}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFilterSheet;
