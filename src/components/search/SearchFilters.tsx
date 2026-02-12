import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categories } from "@/data/categories";
import { useUxCopy } from "@/hooks/useUxCopy";

interface SearchFiltersProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const SearchFiltersContent = ({
  selectedCategory, onCategoryChange, priceRange, onPriceRangeChange, sortBy, onSortByChange, onClearFilters, hasActiveFilters,
}: SearchFiltersProps) => {
  const copy = useUxCopy();
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
              <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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

const SearchFilters = (props: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const copy = useUxCopy();

  return (
    <>
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {copy.search_page.filters}
          </h3>
          <SearchFiltersContent {...props} />
        </div>
      </div>

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
    </>
  );
};

export default SearchFilters;
