import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CategoryHero from "@/components/category/CategoryHero";
import SubcategoryPills from "@/components/category/SubcategoryPills";
import CategorySearchBar from "@/components/category/CategorySearchBar";
import StickyFilterBar, { type QuickFilters } from "@/components/category/StickyFilterBar";
import MobileFilterSheet from "@/components/category/MobileFilterSheet";
import { DiscoveryRailsTop, DiscoveryRailsBottom } from "@/components/category/DiscoveryRails";
import EmptyCategoryState from "@/components/category/EmptyCategoryState";
import ProductCardSkeleton from "@/components/category/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug } from "@/data/categories";
import { useProducts } from "@/hooks/queries/useProducts";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { expandSearchTerms } from "@/lib/searchSynonyms";
import { supabase } from "@/integrations/supabase/client";
import { Filter } from "lucide-react";

const PAGE_SIZE = 24;

const normalizeCity = (s: string | null | undefined) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CategoryDetail = () => {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug || "");
  const copy = useUxCopy();
  const { language, t } = useLanguage();

  // Filters state
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [quickFilters, setQuickFilters] = useState<QuickFilters>({
    verifiedOnly: false,
    underFifty: false,
    underHundred: false,
    city: null,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [selectedSubcategory, searchTerm, priceRange, sortBy, quickFilters]);

  const { data: products = [], isLoading } = useProducts(
    category ? { category: category.name } : undefined,
  );
  const catName = category ? (language === "en" ? category.nameEn : category.name) : "";

  // KYC verification map for the verifiedOnly filter (lazy)
  const ownerIds = useMemo(() => Array.from(new Set(products.map((p) => p.owner_id))), [products]);
  const { data: verifiedSet } = useQuery({
    queryKey: ["category-kyc", ownerIds.sort().join(",")],
    enabled: quickFilters.verifiedOnly && ownerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, kyc_status")
        .in("id", ownerIds);
      return new Set((data || []).filter((r: any) => r.kyc_status === "approved").map((r: any) => r.id));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Per-subcategory counts (always over the unfiltered set)
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.subcategory) counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
    });
    return counts;
  }, [products]);

  const topCity = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.location_city) counts[p.location_city] = (counts[p.location_city] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || null;
  }, [products]);

  const newThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return products.filter((p) => new Date(p.created_at).getTime() >= cutoff).length;
  }, [products]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    const expanded = searchTerm.trim().length >= 2 ? expandSearchTerms(searchTerm) : [];
    let result = products.filter((p) => {
      const price = p.daily_price_owner;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (selectedSubcategory !== "all" && p.subcategory !== selectedSubcategory) return false;
      if (quickFilters.underFifty && price > 50) return false;
      if (quickFilters.underHundred && price > 100) return false;
      if (quickFilters.city && quickFilters.city !== "near" && normalizeCity(p.location_city) !== normalizeCity(quickFilters.city)) return false;
      if (quickFilters.verifiedOnly && verifiedSet && !verifiedSet.has(p.owner_id)) return false;
      if (expanded.length) {
        const hay = `${p.title} ${p.description ?? ""}`.toLowerCase();
        const ok = expanded.some((term) => hay.includes(term.toLowerCase()));
        if (!ok) return false;
      }
      return true;
    });

    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    else if (sortBy === "newest") result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [products, priceRange, selectedSubcategory, sortBy, quickFilters, verifiedSet, searchTerm]);

  // Discovery rails (only when no filters active)
  const hasActiveFilters =
    selectedSubcategory !== "all" || searchTerm.trim().length > 0 ||
    priceRange[0] !== 0 || priceRange[1] !== 1000 ||
    quickFilters.verifiedOnly || quickFilters.underFifty || quickFilters.underHundred || quickFilters.city !== null;

  const trending = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(() => {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return products.filter((p) => new Date(p.created_at).getTime() >= cutoff).slice(0, 8);
  }, [products]);
  const nearby = useMemo(() => {
    if (!topCity) return [];
    return products.filter((p) => p.location_city === topCity).slice(0, 8);
  }, [products, topCity]);

  const activeCount =
    (selectedSubcategory !== "all" ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 1000 ? 1 : 0) +
    (quickFilters.verifiedOnly ? 1 : 0) +
    (quickFilters.underFifty || quickFilters.underHundred ? 1 : 0) +
    (quickFilters.city ? 1 : 0);

  const resetAll = () => {
    setSelectedSubcategory("all");
    setSearchTerm("");
    setPriceRange([0, 1000]);
    setSortBy("relevance");
    setQuickFilters({ verifiedOnly: false, underFifty: false, underHundred: false, city: null });
  };

  // Legacy slug redirect
  if (slug === "echipamente-agricole") return <Navigate to="/categorie/utilaje" replace />;

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

  // Hi-res banner
  const rawImage = category.subcategories[0]?.image || "";
  const bannerImage = rawImage.includes("unsplash.com")
    ? rawImage.replace(/w=\d+/, "w=1920").replace(/q=\d+/, "q=85")
    : rawImage;

  const visible = filteredProducts.slice(0, page * PAGE_SIZE);
  const canLoadMore = visible.length < filteredProducts.length;

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

      {/* Sentinel used by sticky filter bar to detect engagement */}
      <div id="category-sentinel" />

      <main className="container py-6 md:py-8 space-y-6">
        {/* Search bar */}
        <CategorySearchBar
          categoryName={catName}
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {/* Subcategory pills */}
        <SubcategoryPills
          subcategories={category.subcategories}
          counts={subcategoryCounts}
          total={products.length}
          selected={selectedSubcategory}
          onSelect={setSelectedSubcategory}
        />

        {/* Sticky filter bar */}
        <StickyFilterBar
          filters={quickFilters}
          onChange={setQuickFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          activeCount={activeCount}
          resultCount={filteredProducts.length}
        />

        {/* Discovery rails (browse mode only) */}
        {!hasActiveFilters && !isLoading && products.length > 0 && (
          <DiscoveryRailsTop newArrivals={newArrivals} />
        )}

        {/* Results header (only in filter mode) */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between motion-safe:animate-fade-in-up">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground">
              {t(`${filteredProducts.length} rezultate`, `${filteredProducts.length} results`)}
            </h2>
            <button
              onClick={resetAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("Resetează", "Reset")}
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} delay={i * 50} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredProducts.length === 0 && (
          <EmptyCategoryState onResetFilters={resetAll} hasActiveFilters={hasActiveFilters} />
        )}

        {/* Main products grid (always shown so sort + view toggle have effect) */}
        {!isLoading && filteredProducts.length > 0 && (
          <>
            {!hasActiveFilters && (
              <div className="flex items-center justify-between motion-safe:animate-fade-in-up">
                <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                  {t(`Toate produsele (${filteredProducts.length})`, `All products (${filteredProducts.length})`)}
                </h2>
              </div>
            )}
            <div
              className={
                viewMode === "gallery"
                  ? "grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "flex flex-col gap-4"
              }
            >
              {visible.map((product, i) => (
                <div
                  key={product.id}
                  className="motion-safe:animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <ProductCard product={product} viewMode={viewMode} />
                </div>
              ))}
            </div>
            {canLoadMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-11"
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("Încarcă mai multe", "Load more")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Discovery rails - bottom (Trending + Aproape de tine, 2 per row) */}
        {!hasActiveFilters && !isLoading && products.length > 0 && (
          <DiscoveryRailsBottom trending={trending} nearby={nearby} />
        )}
      </main>

      {/* Floating mobile filter button */}
      <button
        onClick={() => setMobileFiltersOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 h-12 shadow-lg active:scale-95 transition-transform"
        aria-label={t("Filtre", "Filters")}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">{t("Filtre", "Filters")}</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground px-1.5 text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      <MobileFilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        filters={quickFilters}
        onFiltersChange={setQuickFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredProducts.length}
        onReset={resetAll}
      />

      <Footer />
    </div>
  );
};

export default CategoryDetail;
