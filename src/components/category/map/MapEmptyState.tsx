import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  searchQuery?: string;
  suggestions?: string[];
  onSuggestionClick?: (term: string) => void;
  onClearSearch?: () => void;
}

/**
 * Shown inside the map listing panel (and the grid/list views) when the
 * current keyword matches no listing.
 */
const MapEmptyState = ({ searchQuery, suggestions = [], onSuggestionClick, onClearSearch }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <SearchX className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {searchQuery
          ? t(`Niciun anunț pentru „${searchQuery}”`, `No listings for “${searchQuery}”`)
          : t("Niciun anunț găsit", "No listings found")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t(
          "Încearcă un alt cuvânt cheie sau mărește zona de căutare pe hartă.",
          "Try another keyword or widen the search area on the map.",
        )}
      </p>

      {suggestions.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("Poate căutai", "Maybe you meant")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestionClick?.(s)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {searchQuery && onClearSearch && (
        <Button variant="outline" className="mt-6 rounded-full" onClick={onClearSearch}>
          {t("Șterge căutarea", "Clear search")}
        </Button>
      )}
    </div>
  );
};

export default MapEmptyState;
