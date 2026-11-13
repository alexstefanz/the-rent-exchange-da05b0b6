import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Loader2, LayoutGrid, List, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SearchFilters, { InlineSearchFilters } from "@/components/search/SearchFilters";
import EmptySearchState from "@/components/search/EmptySearchState";
import { useProducts } from "@/hooks/queries/useProducts";
import { ProductFilters, calculateClientPrice } from "@/features/products/productsApi";
import { useUxCopy } from "@/hooks/useUxCopy";
import { judete } from "@/data/romaniaLocations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import CategoryMapView from "@/components/category/map/CategoryMapView";
import MapEmptyState from "@/components/category/map/MapEmptyState";
import { CONDITION_LABELS, type ProductCondition } from "@/lib/publishTypes";
import { useSearchSuggestions } from "@/hooks/queries/useSearchSuggestions";


const Search = () => {
  const copy = useUxCopy();
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categorie") || "";
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";

  usePageSeo({
    title: t("Caută produse de închiriat — Rentli", "Search rentals — Rentli"),
    description: t(
      "Filtrează după categorie, oraș și preț. Găsește instant ce ai nevoie pe Rentli.",
      "Filter by category, city and price. Find what you need instantly on Rentli.",
    ),
    // Keyword / view variants are near-duplicates of the base search page.
    noindex: Boolean(initialQuery || searchParams.get("view")),
  });

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const initialView = (searchParams.get("view") as "map" | "gallery" | "list") || "map";
  const [viewMode, setViewMode] = useState<"map" | "gallery" | "list">(
    ["map", "gallery", "list"].includes(initialView) ? initialView : "map",
  );

  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [selectedJudet, setSelectedJudet] = useState(judetFilter || "all");
  const [selectedCity, setSelectedCity] = useState(localitateFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [priceTouched, setPriceTouched] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get("stare") || "all");
  const handleConditionChange = (value: string) => {
    setSelectedCondition(value);
    const np = new URLSearchParams(searchParams);
    if (value !== "all") np.set("stare", value); else np.delete("stare");
    setSearchParams(np, { replace: true });
  };

  const productFilters = useMemo((): ProductFilters => {
    const filters: ProductFilters = {};
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategory && selectedCategory !== "all") filters.category = selectedCategory;
    if (selectedCity && selectedCity !== "all") filters.location_city = selectedCity;
    return filters;
  }, [searchQuery, selectedCategory, selectedCity]);

  const { data: products = [], isLoading } = useProducts(productFilters);

  const priceBounds = useMemo<[number, number]>(() => {
    if (!products.length) return [0, 1000];
    let min = Infinity;
    let max = -Infinity;
    for (const p of products) {
      const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent);
      if (cp < min) min = cp;
      if (cp > max) max = cp;
    }
    const lo = Math.floor(Math.max(0, min));
    const hi = Math.ceil(Math.max(lo + 1, max));
    return [lo, hi];
  }, [products]);

  useEffect(() => {
    if (!priceTouched) setPriceRange(priceBounds);
  }, [priceBounds, priceTouched]);

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceTouched(true);
    setPriceRange(value);
  };
  const judetCitiesSet = useMemo(() => {
    if (selectedJudet === "all") return null;
    const j = judete.find((x) => x.name === selectedJudet);
    return j ? new Set(j.localitati) : new Set<string>();
  }, [selectedJudet]);
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (judetCitiesSet && selectedCity === "all") {
      result = result.filter((p) => p.location_city && judetCitiesSet.has(p.location_city));
    }
    if (selectedCondition !== "all") result = result.filter((p) => p.condition === selectedCondition);
    result = result.filter((p) => { const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent); return cp >= priceRange[0] && cp <= priceRange[1]; });
    if (sortBy === "price_asc") result.sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    else if (sortBy === "price_desc") result.sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    return result;
  }, [products, judetCitiesSet, selectedCity, priceRange, sortBy, selectedCondition]);

  const hasActiveFilters = (selectedCategory && selectedCategory !== "all") || (selectedJudet && selectedJudet !== "all") || (selectedCity && selectedCity !== "all") || (priceTouched && (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1])) || sortBy !== "relevance" || selectedCondition !== "all";
  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    const np = new URLSearchParams(searchParams);
    if (value && value !== "all") np.set("localitate", value); else np.delete("localitate");
    setSearchParams(np, { replace: true });
  };
  const handleJudetChange = (value: string) => {
    setSelectedJudet(value);
    const np = new URLSearchParams(searchParams);
    if (value && value !== "all") np.set("judet", value); else np.delete("judet");
    const j = judete.find((x) => x.name === value);
    if (!j || !j.localitati.includes(selectedCity)) {
      setSelectedCity("all");
      np.delete("localitate");
    }
    setSearchParams(np, { replace: true });
  };
  const handleClearFilters = () => {
    setSelectedCategory("all"); setSelectedJudet("all"); setSelectedCity("all"); setPriceRange(priceBounds); setPriceTouched(false); setSortBy("relevance"); setSelectedCondition("all");
    const np = new URLSearchParams(searchParams);
    np.delete("stare");
    np.delete("judet");
    np.delete("localitate");
    setSearchParams(np, { replace: true });
  };
  const handleSearchChange = (value: string) => { setSearchQuery(value); const np = new URLSearchParams(searchParams); if (value) np.set("q", value); else np.delete("q"); setSearchParams(np, { replace: true }); };
  const handleViewChange = (value: "map" | "gallery" | "list") => {
    setViewMode(value);
    const np = new URLSearchParams(searchParams);
    np.set("view", value);
    setSearchParams(np, { replace: true });
  };

  // Alternative keywords proposed when the current search returns nothing.
  const suggestions = useSearchSuggestions(
    searchQuery,
    !isLoading && Boolean(searchQuery) && products.length === 0,
  );

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("map")} aria-label={t("Hartă", "Map")}><MapIcon className="h-4 w-4" /></Button>
      <Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("gallery")}><LayoutGrid className="h-4 w-4" /></Button>
      <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("list")}><List className="h-4 w-4" /></Button>
    </div>
  );



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={viewMode === "map" ? "w-full px-4 pt-4 lg:px-8" : "container py-8"}>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{copy.search_page.title}</h1>
          <p className="mt-1 text-muted-foreground hidden md:block">{searchQuery ? copy.search_page.searchFor(searchQuery) : copy.search_page.allProducts}</p>
        </div>
        <div className="mb-6 max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder={copy.search.placeholder} value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="h-12 pl-12 text-base" />
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="hidden lg:flex items-center gap-2">
            <Select value={selectedJudet} onValueChange={handleJudetChange}>
              <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
                <SelectValue placeholder={t("Toate județele", "All counties")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{t("Toate județele", "All counties")}</SelectItem>
                {[...judete]
                  .sort((a, b) => a.name.localeCompare(b.name, "ro", { sensitivity: "base" }))
                  .map((j) => (
                    <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={handleCityChange} disabled={selectedJudet === "all"}>
              <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
                <SelectValue placeholder={t("Toate localitățile", "All cities")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{t("Toate localitățile", "All cities")}</SelectItem>
                {(judete.find((x) => x.name === selectedJudet)?.localitati ?? [])
                  .slice()
                  .sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }))
                  .map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* Mobile-only: map/grid/list on the left */}
          <div className="flex lg:hidden">{viewToggle}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCondition} onValueChange={handleConditionChange}>
              <SelectTrigger className="h-9 w-auto min-w-[150px] text-sm" aria-label={t("Starea produsului", "Product condition")}>
                <SelectValue placeholder={t("Toate stările", "Any condition")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Toate stările", "Any condition")}</SelectItem>
                {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map((c) => (
                  <SelectItem key={c} value={c}>{CONDITION_LABELS[c][language]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InlineSearchFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedCity={selectedCity} onCityChange={handleCityChange} selectedJudet={selectedJudet} onJudetChange={handleJudetChange} priceRange={priceRange} onPriceRangeChange={handlePriceRangeChange} priceMin={priceBounds[0]} priceMax={priceBounds[1]} sortBy={sortBy} onSortByChange={setSortBy} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters} hideLocation />
            <div className="hidden lg:flex">{viewToggle}</div>
            <div className="lg:hidden">
              <SearchFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedCity={selectedCity} onCityChange={handleCityChange} selectedJudet={selectedJudet} onJudetChange={handleJudetChange} priceRange={priceRange} onPriceRangeChange={handlePriceRangeChange} priceMin={priceBounds[0]} priceMax={priceBounds[1]} sortBy={sortBy} onSortByChange={setSortBy} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters} />
            </div>
          </div>
        </div>
        <div className={viewMode === "map" ? "min-w-0 -mx-4 lg:-mx-8" : "min-w-0"}>
          {viewMode === "map" && (
            <CategoryMapView
              products={filteredProducts}
              isLoading={isLoading}
              searchQuery={searchQuery}
              suggestions={suggestions}
              onSuggestionClick={handleSearchChange}
              onClearSearch={() => handleSearchChange("")}
            />
          )}
          {viewMode !== "map" && isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {viewMode !== "map" && !isLoading && filteredProducts.length > 0 && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">{copy.search.resultsCount(filteredProducts.length)}</p>
              <div className={viewMode === "gallery" ? "grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} viewMode={viewMode === "list" ? "list" : "gallery"} />)}
              </div>
            </div>
          )}
          {viewMode !== "map" && !isLoading && filteredProducts.length === 0 && (
            products.length > 0 && hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-foreground">{t("Niciun rezultat cu filtrele curente", "No results with the current filters")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{products.length === 1 ? t("Există 1 anunț care se potrivește căutării.", "There is 1 listing that matches your search.") : t(`Există ${products.length} anunțuri care se potrivesc căutării.`, `There are ${products.length} listings that match your search.`)}</p>
                <Button className="mt-4" onClick={handleClearFilters}>{t("Resetează filtrele", "Reset filters")}</Button>
              </div>
            ) : searchQuery ? (
              <MapEmptyState
                searchQuery={searchQuery}
                suggestions={suggestions}
                onSuggestionClick={handleSearchChange}
                onClearSearch={() => handleSearchChange("")}
              />
            ) : (
              <EmptySearchState searchQuery={searchQuery} type="products" />
            )
          )}
        </div>
      </main>
      {viewMode !== "map" && <Footer />}
    </div>

  );
};

export default Search;
