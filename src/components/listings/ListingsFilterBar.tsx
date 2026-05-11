import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export type ListingsSort = "recent" | "price_asc" | "price_desc" | "title_asc";
export type ListingsStatusFilter = "all" | "active" | "pending" | "draft" | "hidden" | "rejected";

export interface ListingsFilters {
  search: string;
  status: ListingsStatusFilter;
  category: string;
  city: string;
  sort: ListingsSort;
}

interface Props {
  filters: ListingsFilters;
  onChange: (next: ListingsFilters) => void;
  categories: string[];
  cities: string[];
  resultCount: number;
}

const ListingsFilterBar = ({ filters, onChange, categories, cities, resultCount }: Props) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const [sheetOpen, setSheetOpen] = useState(false);

  const set = <K extends keyof ListingsFilters>(k: K, v: ListingsFilters[K]) => onChange({ ...filters, [k]: v });
  const reset = () => onChange({ search: "", status: "all", category: "all", city: "all", sort: "recent" });
  const activeCount = [
    filters.status !== "all",
    filters.category !== "all",
    filters.city !== "all",
    filters.sort !== "recent",
  ].filter(Boolean).length;

  const StatusSelect = (
    <Select value={filters.status} onValueChange={(v) => set("status", v as ListingsStatusFilter)}>
      <SelectTrigger className="h-10 w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("Toate statusurile", "All statuses")}</SelectItem>
        <SelectItem value="active">{t("Active", "Active")}</SelectItem>
        <SelectItem value="pending">{t("În verificare", "In review")}</SelectItem>
        <SelectItem value="hidden">{t("Ascunse", "Hidden")}</SelectItem>
        <SelectItem value="rejected">{t("Respinse", "Rejected")}</SelectItem>
      </SelectContent>
    </Select>
  );
  const CategorySelect = (
    <Select value={filters.category} onValueChange={(v) => set("category", v)}>
      <SelectTrigger className="h-10 w-full sm:w-[160px]"><SelectValue placeholder={t("Categorie", "Category")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("Toate categoriile", "All categories")}</SelectItem>
        {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const CitySelect = (
    <Select value={filters.city} onValueChange={(v) => set("city", v)}>
      <SelectTrigger className="h-10 w-full sm:w-[160px]"><SelectValue placeholder={t("Oraș", "City")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("Toate orașele", "All cities")}</SelectItem>
        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const SortSelect = (
    <Select value={filters.sort} onValueChange={(v) => set("sort", v as ListingsSort)}>
      <SelectTrigger className="h-10 w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">{t("Cele mai recente", "Most recent")}</SelectItem>
        <SelectItem value="price_desc">{t("Preț descrescător", "Price: high to low")}</SelectItem>
        <SelectItem value="price_asc">{t("Preț crescător", "Price: low to high")}</SelectItem>
        <SelectItem value="title_asc">{t("Alfabetic A-Z", "Alphabetical A-Z")}</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="sticky top-16 z-20 -mx-4 border-y border-border/60 bg-background/85 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:shadow-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder={t("Caută în anunțurile tale…", "Search your listings…")}
            className="h-10 pl-9"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {StatusSelect}{CategorySelect}{CitySelect}{SortSelect}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 lg:hidden gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t("Filtre", "Filters")}
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{activeCount}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader><SheetTitle>{t("Filtre și sortare", "Filters & sorting")}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">{t("Status", "Status")}</label>{StatusSelect}</div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">{t("Categorie", "Category")}</label>{CategorySelect}</div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">{t("Oraș", "City")}</label>{CitySelect}</div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">{t("Sortare", "Sort")}</label>{SortSelect}</div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={reset}>{t("Resetează", "Reset")}</Button>
                <Button className="flex-1" onClick={() => setSheetOpen(false)}>{t("Aplică", "Apply")}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t(`${resultCount} rezultate`, `${resultCount} results`)}</span>
        {(filters.search || activeCount > 0) && (
          <button onClick={reset} className="inline-flex items-center gap-1 hover:text-foreground">
            <X className="h-3 w-3" /> {t("Resetează", "Reset")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingsFilterBar;