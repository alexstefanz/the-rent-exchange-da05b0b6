import { useState, useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Loader2, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CategoryHero from "@/components/category/CategoryHero";
import SearchFilters, { InlineSearchFilters } from "@/components/search/SearchFilters";
import EmptySearchState from "@/components/search/EmptySearchState";
import { useProducts } from "@/hooks/queries/useProducts";
import { ProductFilters, calculateClientPrice } from "@/features/products/productsApi";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryBySlug } from "@/data/categories";

const CategoryDetail = () => {
  const { slug } = useParams();
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Legacy slug redirect
  if (slug === "echipamente-agricole") return <Navigate to="/categorie/utilaje" replace />;

  const category = getCategoryBySlug(slug || "");

  const initialQuery = searchParams.get("q") || "";
  const subcategoryFilter = searchParams.get("subcategorie") || "";
  const localitateFilter = searchParams.get("localitate") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryFilter || "all");
  const [selectedCity, setSelectedCity] = useState(localitateFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");

  const catName = category ? (language === "en" ? category.nameEn : category.name) : "";

  const bannerImage = useMemo(() => {
    if (!category) return "";
    const sub = category.subcategories.find((s) => s.image);
    const base = sub?.image || "";
    if (!base) return "";
    // Upscale Unsplash URLs
    try {
      const url = new URL(base);
      if (url.hostname.includes("unsplash.com")) {
        url.searchParams.set("w", "1920");
        url.searchParams.set("q", "85");
        return url.toString();
      }
    } catch {}
    return base;
  }, [category]);

  const subcategoryOptions = useMemo(() => {
    if (!category) return [];
    return category.subcategories
      .map((s) => ({ value: s.name, label: language === "en" && s.nameEn ? s.nameEn : s.name }))
      .sort((a, b) => a.label.localeCompare(b.label, "ro", { sensitivity: "base" }));
  }, [category, language]);

  const productFilters = useMemo((): ProductFilters => {
    const filters: ProductFilters = {};
    if (category) filters.category = category.name;
    if (searchQuery) filters.search = searchQuery;
    if (selectedCity && selectedCity !== "all") filters.location_city = selectedCity;
    return filters;
  }, [category, searchQuery, selectedCity]);

  const { data: products = [], isLoading } = useProducts(category ? productFilters : undefined);

  const { topCity, newThisWeek } = useMemo(() => {
    if (!products.length) return { topCity: null as string | null, newThisWeek: 0 };
    const counts: Record<string, number> = {};
    let weekCount = 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const p of products) {
      if (p.location_city) counts[p.location_city] = (counts[p.location_city] || 0) + 1;
      const created = (p as any).created_at ? new Date((p as any).created_at).getTime() : 0;
      if (created && created >= weekAgo) weekCount++;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { topCity: top ? top[0] : null, newThisWeek: weekCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (selectedSubcategory !== "all" && p.subcategory !== selectedSubcategory) return false;
      const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent);
      if (cp < priceRange[0] || cp > priceRange[1]) return false;
      return true;
    });
    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    return result;
  }, [products, selectedSubcategory, priceRange, sortBy]);

  const hasActiveFilters =
    (selectedSubcategory && selectedSubcategory !== "all") ||
    (selectedCity && selectedCity !== "all") ||
    priceRange[0] > 0 || priceRange[1] < 1000 ||
    sortBy !== "relevance";

  const updateParam = (key: string, value: string) => {
    const np = new URLSearchParams(searchParams);
    if (value && value !== "all") np.set(key, value);
    else np.delete(key);
    setSearchParams(np, { replace: true });
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    updateParam("localitate", value);
  };
  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    updateParam("subcategorie", value);
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const np = new URLSearchParams(searchParams);
    if (value) np.set("q", value); else np.delete("q");
    setSearchParams(np, { replace: true });
  };
  const handleClearFilters = () => {
    setSelectedSubcategory("all");
    setSelectedCity("all");
    setPriceRange([0, 1000]);
    setSortBy("relevance");
    const np = new URLSearchParams(searchParams);
    np.delete("subcategorie");
    np.delete("localitate");
    setSearchParams(np, { replace: true });
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">{copy.categoryDetail.categoryNotFound}</h1>
          <Button asChild className="mt-4">
            <Link to="/categorii">{copy.categoryDetail.backToCategories}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CategoryHero
        name={catName}
        bannerImage={bannerImage}
        total={products.length}
        newThisWeek={newThisWeek}
        topCity={topCity}
      />
      <main className="container py-8">
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={copy.search.placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-12 pl-12 text-base"
            />
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {!isLoading && copy.search.resultsCount(filteredProducts.length)}
          </p>
          <div className="flex items-center gap-2">
            <InlineSearchFilters
              selectedCategory="all"
              onCategoryChange={() => {}}
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              subcategoryOptions={subcategoryOptions}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={handleSubcategoryChange}
            />
            <SearchFilters
              selectedCategory="all"
              onCategoryChange={() => {}}
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              subcategoryOptions={subcategoryOptions}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={handleSubcategoryChange}
            />
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-1">
              <Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("gallery")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && filteredProducts.length > 0 && (
            <div className={viewMode === "gallery" ? "grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
          {!isLoading && filteredProducts.length === 0 && (
            <EmptySearchState searchQuery={searchQuery} type="products" />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryDetail;