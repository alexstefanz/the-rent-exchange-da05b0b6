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
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const sortedCities = Array.from(new Set(judete.flatMap((j) => j.localitati))).sort((a, b) =>
  a.localeCompare(b, "ro", { sensitivity: "base" }),
);

const SearchFiltersContent = ({
  selectedCategory, onCategoryChange, selectedCity, onCityChange, priceRange, onPriceRangeChange, sortBy, onSortByChange, onClearFilters, hasActiveFilters,
}: SearchFiltersProps) => {
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <X className="mr-2 h-4 w-4" />
          {copy.search.filters.clearAll}
        </Button>
      )}

      <div className="space-y-3">
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
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t("Locație", "Location")}</label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="w-full"><SelectValue placeholder={t("Toate orașele", "All cities")} /></SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">{t("Toate orașele", "All cities")}</SelectItem>
            {sortedCities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{copy.search.filters.priceRange}</label>
        <div className="px-2">
          <Slider value={priceRange} onValueChange={(value) => onPriceRangeChange(value as [number, number])} max={1000} min={0} step={10} className="w-full" />
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
  selectedCategory, onCategoryChange, selectedCity, onCityChange, priceRange, onPriceRangeChange, sortBy, onSortByChange, onClearFilters, hasActiveFilters,
}: SearchFiltersProps) => {
  const copy = useUxCopy();
  const { language, t } = useLanguage();

  const priceLabel = priceRange[0] === 0 && priceRange[1] === 1000
    ? copy.search.filters.priceRange
    : `${priceRange[0]} - ${priceRange[1]} RON`;

  return (
    <div className="hidden lg:flex items-center gap-2">
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

      <Select value={selectedCity} onValueChange={onCityChange}>
        <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
          <SelectValue placeholder={t("Toate orașele", "All cities")} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="all">{t("Toate orașele", "All cities")}</SelectItem>
          {sortedCities.map((city) => (
            <SelectItem key={city} value={city}>{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm font-normal gap-1">
            {priceLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">{copy.search.filters.priceRange}</p>
            <Slider value={priceRange} onValueChange={(value) => onPriceRangeChange(value as [number, number])} max={1000} min={0} step={10} className="w-full" />
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
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {copy.search_page.filters}
            {props.hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">!</span>
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
