import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { categories } from "@/data/categories";
import { judete } from "@/data/romaniaLocations";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchFiltersProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (value: string) => void;
  selectedJudet?: string;
  onJudetChange?: (value: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  /** Optional: when provided, the "Category" dropdown is replaced by a subcategory dropdown. */
  subcategoryOptions?: { value: string; label: string }[];
  selectedSubcategory?: string;
  onSubcategoryChange?: (value: string) => void;
  /** When true, the județ/localitate selects are hidden (used when they're rendered elsewhere). */
  hideLocation?: boolean;
  /** Optional dynamic bounds for the price slider. Defaults to 0 / 1000. */
  priceMin?: number;
  priceMax?: number;
}

const sortedJudete = [...judete].sort((a, b) =>
  a.name.localeCompare(b.name, "ro", { sensitivity: "base" }),
);

const getLocalitatiForJudet = (judetName: string | undefined): string[] => {
  if (!judetName || judetName === "all") return [];
  const j = judete.find((x) => x.name === judetName);
  if (!j) return [];
  return [...j.localitati].sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }));
};

const SearchFiltersContent = ({
  selectedCategory, onCategoryChange, selectedCity, onCityChange, selectedJudet, onJudetChange, priceRange, onPriceRangeChange, sortBy, onSortByChange, onClearFilters, hasActiveFilters,
  subcategoryOptions, selectedSubcategory, onSubcategoryChange, hideLocation, priceMin = 0, priceMax = 1000,
}: SearchFiltersProps) => {
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const localitati = getLocalitatiForJudet(selectedJudet);
  const judetDisabled = !onJudetChange;
  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <X className="mr-2 h-4 w-4" />
          {copy.search.filters.clearAll}
        </Button>
      )}

      <div className="space-y-3">
        {subcategoryOptions ? (
          <>
            <label className="text-sm font-medium text-foreground">{t("Subcategorie", "Subcategory")}</label>
            <Select value={selectedSubcategory ?? "all"} onValueChange={onSubcategoryChange}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("Toate subcategoriile", "All subcategories")} /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{t("Toate subcategoriile", "All subcategories")}</SelectItem>
                {subcategoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <label className="text-sm font-medium text-foreground">{copy.search.filters.category}</label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full"><SelectValue placeholder={copy.search_page.allCategoriesFilter} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.search_page.allCategoriesFilter}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>{language === "en" && category.nameEn ? category.nameEn : category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {!hideLocation && (
        <>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t("Județ", "County")}</label>
            <Select value={selectedJudet ?? "all"} onValueChange={onJudetChange} disabled={judetDisabled}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("Toate județele", "All counties")} /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{t("Toate județele", "All counties")}</SelectItem>
                {sortedJudete.map((j) => (
                  <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t("Localitate", "City")}</label>
            <Select
              value={selectedCity}
              onValueChange={onCityChange}
              disabled={!selectedJudet || selectedJudet === "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("Toate localitățile", "All cities")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{t("Toate localitățile", "All cities")}</SelectItem>
                {localitati.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{copy.search.filters.priceRange}</label>
        <div className="px-2">
          <Slider value={priceRange} onValueChange={(value) => onPriceRangeChange(value as [number, number])} max={priceMax} min={priceMin} step={Math.max(1, Math.round((priceMax - priceMin) / 100))} className="w-full" />
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} RON</span>
            <span>{priceRange[1]} RON</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{copy.search.filters.sortBy}</label>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full"><SelectValue placeholder={copy.search.filters.relevance} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{copy.search.filters.relevance}</SelectItem>
            <SelectItem value="price_asc">{copy.search.filters.priceAsc}</SelectItem>
            <SelectItem value="price_desc">{copy.search.filters.priceDesc}</SelectItem>
            <SelectItem value="nearest">{copy.search.filters.nearest}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export const InlineSearchFilters = ({
  selectedCategory, onCategoryChange, selectedCity, onCityChange, selectedJudet, onJudetChange, priceRange, onPriceRangeChange, sortBy, onSortByChange, onClearFilters, hasActiveFilters,
  subcategoryOptions, selectedSubcategory, onSubcategoryChange, hideLocation, priceMin = 0, priceMax = 1000,
}: SearchFiltersProps) => {
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const localitati = getLocalitatiForJudet(selectedJudet);

  const priceLabel = priceRange[0] === priceMin && priceRange[1] === priceMax
    ? copy.search.filters.priceRange
    : `${priceRange[0]} - ${priceRange[1]} RON`;

  return (
    <div className="hidden lg:flex items-center gap-2">
      {subcategoryOptions ? (
        <Select value={selectedSubcategory ?? "all"} onValueChange={onSubcategoryChange}>
          <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
            <SelectValue placeholder={t("Toate subcategoriile", "All subcategories")} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">{t("Toate subcategoriile", "All subcategories")}</SelectItem>
            {subcategoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
            <SelectValue placeholder={copy.search_page.allCategoriesFilter} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.search_page.allCategoriesFilter}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>{language === "en" && category.nameEn ? category.nameEn : category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!hideLocation && (
        <>
          <Select value={selectedJudet ?? "all"} onValueChange={onJudetChange} disabled={!onJudetChange}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
              <SelectValue placeholder={t("Toate județele", "All counties")} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">{t("Toate județele", "All counties")}</SelectItem>
              {sortedJudete.map((j) => (
                <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCity}
            onValueChange={onCityChange}
            disabled={!selectedJudet || selectedJudet === "all"}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
              <SelectValue placeholder={t("Toate localitățile", "All cities")} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">{t("Toate localitățile", "All cities")}</SelectItem>
              {localitati.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm font-normal gap-1">
            {priceLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">{copy.search.filters.priceRange}</p>
            <Slider value={priceRange} onValueChange={(value) => onPriceRangeChange(value as [number, number])} max={priceMax} min={priceMin} step={Math.max(1, Math.round((priceMax - priceMin) / 100))} className="w-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{priceRange[0]} RON</span>
              <span>{priceRange[1]} RON</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="h-9 w-auto min-w-[130px] text-sm">
          <SelectValue placeholder={copy.search.filters.relevance} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">{copy.search.filters.relevance}</SelectItem>
          <SelectItem value="price_asc">{copy.search.filters.priceAsc}</SelectItem>
          <SelectItem value="price_desc">{copy.search.filters.priceDesc}</SelectItem>
          <SelectItem value="nearest">{copy.search.filters.nearest}</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground" onClick={onClearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const SearchFilters = (props: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const copy = useUxCopy();

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className="h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Filter className="h-4 w-4" />
            {copy.search_page.filters}
            {props.hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs text-primary">!</span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {copy.search_page.filters}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SearchFiltersContent {...props} />
          </div>
          <div className="mt-6">
            <Button className="w-full" onClick={() => setIsOpen(false)}>
              {copy.search_page.applyFilters}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SearchFilters;
