import { useState, useMemo, useEffect } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Loader2, LayoutGrid, List, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileFixedBackButton from "@/components/shared/MobileFixedBackButton";
import ProductCard from "@/components/products/ProductCard";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryMapView from "@/components/category/map/CategoryMapView";
import SearchFilters, { InlineSearchFilters } from "@/components/search/SearchFilters";
import EmptySearchState from "@/components/search/EmptySearchState";
import MapEmptyState from "@/components/category/map/MapEmptyState";
import { useSearchSuggestions } from "@/hooks/queries/useSearchSuggestions";

import { useProducts } from "@/hooks/queries/useProducts";
import { ProductFilters, calculateClientPrice } from "@/features/products/productsApi";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryBySlug } from "@/data/categories";
import { judete } from "@/data/romaniaLocations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageSeo } from "@/hooks/usePageSeo";
import { getCategorySeoCopy } from "@/data/categorySeo";
import { getCategoryContent } from "@/data/categoryContent";
import CategorySeoContent from "@/components/seo/CategorySeoContent";
import { truncateForMeta, META_TITLE_MAX, META_DESCRIPTION_MAX } from "@/lib/seoText";


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
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  // When a keyword is typed we search across every category by default.
  const [restrictToCategory, setRestrictToCategory] = useState(false);

  const initialView = (searchParams.get("view") as "map" | "gallery" | "list") || "map";
  const [viewMode, setViewMode] = useState<"map" | "gallery" | "list">(
    ["map", "gallery", "list"].includes(initialView) ? initialView : "map",
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryFilter || "all");
  const [selectedJudet, setSelectedJudet] = useState(judetFilter || "all");
  const [selectedCity, setSelectedCity] = useState(localitateFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [priceTouched, setPriceTouched] = useState(false);
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

  // A keyword search leaves the category scope unless the user asks to stay in it
  // (picking a subcategory is an explicit request to stay inside this category).
  const searchesAllCategories =
    Boolean(searchQuery) && !restrictToCategory && selectedSubcategory === "all";

  const productFilters = useMemo((): ProductFilters => {
    const filters: ProductFilters = {};
    if (category && !searchesAllCategories) filters.category = category.name;
    if (searchQuery) filters.search = searchQuery;
    if (selectedCity && selectedCity !== "all") filters.location_city = selectedCity;
    return filters;
  }, [category, searchQuery, selectedCity, searchesAllCategories]);


  const { data: products = [], isLoading } = useProducts(category ? productFilters : undefined);

  // Dynamic price bounds based on the products in this category (client price incl. fee).
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

  // Sync slider to actual bounds until the user moves it.
  useEffect(() => {
    if (!priceTouched) {
      setPriceRange(priceBounds);
    }
  }, [priceBounds, priceTouched]);

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceTouched(true);
    setPriceRange(value);
  };

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

  const judetCitiesSet = useMemo(() => {
    if (selectedJudet === "all") return null;
    const j = judete.find((x) => x.name === selectedJudet);
    return j ? new Set(j.localitati) : new Set<string>();
  }, [selectedJudet]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (selectedSubcategory !== "all" && p.subcategory !== selectedSubcategory) return false;
      if (judetCitiesSet && selectedCity === "all") {
        if (!p.location_city || !judetCitiesSet.has(p.location_city)) return false;
      }
      const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent);
      if (cp < priceRange[0] || cp > priceRange[1]) return false;
      return true;
    });
    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    return result;
  }, [products, selectedSubcategory, judetCitiesSet, selectedCity, priceRange, sortBy, searchesAllCategories]);

  const suggestions = useSearchSuggestions(
    searchQuery,
    !isLoading && Boolean(searchQuery) && filteredProducts.length === 0,
  );


  const hasActiveFilters =
    (selectedSubcategory && selectedSubcategory !== "all") ||
    (selectedJudet && selectedJudet !== "all") ||
    (selectedCity && selectedCity !== "all") ||
    (priceTouched && (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1])) ||
    sortBy !== "relevance";

  // --- SEO ---------------------------------------------------------------
  const seoCopy = getCategorySeoCopy(category?.slug);
  const seoMinPrice = useMemo(() => {
    if (!products.length) return null;
    let min = Infinity;
    for (const p of products) {
      const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent);
      if (cp > 0 && cp < min) min = cp;
    }
    return Number.isFinite(min) ? Math.floor(min) : null;
  }, [products]);

  const seoKeyword = seoCopy
    ? (language === "en" ? seoCopy.titleKeywordEn : seoCopy.titleKeyword)
    : catName;

  const seoTitle = category
    ? truncateForMeta(
        language === "en"
          ? `${seoKeyword} for rent${seoMinPrice ? ` from ${seoMinPrice} lei/day` : " in Romania"} | Rentli`
          : `${seoKeyword} de închiriat${seoMinPrice ? ` de la ${seoMinPrice} lei/zi` : " în România"} | Rentli`,
        META_TITLE_MAX,
      )
    : (language === "en" ? "Rental category | Rentli" : "Categorie de închirieri | Rentli");

  const seoDescription = category
    ? truncateForMeta(
        seoCopy
          ? (language === "en" ? seoCopy.descriptionEn : seoCopy.description)
          : (language === "en"
              ? `Rent ${catName.toLowerCase()} from verified people. Fair prices, secure payment, photo handover on Rentli.`
              : `Închiriază ${catName.toLowerCase()} de la oameni verificați. Prețuri corecte, plată securizată, predare cu poze pe Rentli.`),
        META_DESCRIPTION_MAX,
      )
    : (language === "en" ? "Explore rentals by category on Rentli." : "Explorează închirieri pe categorii pe Rentli.");

  const categoryFaq = getCategoryContent(category?.slug)?.faq ?? [];

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    image: bannerImage || undefined,
    // Filtered / paginated variants of the same category are near-duplicates.
    noindex: Boolean(hasActiveFilters || searchQuery),
    jsonLd: category ? {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: catName,
          url: `https://rentli.ro/categorie/${category.slug}`,
          description: seoDescription,
          primaryImageOfPage: bannerImage ? {
            "@type": "ImageObject",
            contentUrl: bannerImage,
            caption: catName,
          } : undefined,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: language === "en" ? "Home" : "Acasă", item: "https://rentli.ro/" },
              { "@type": "ListItem", position: 2, name: language === "en" ? "Categories" : "Categorii", item: "https://rentli.ro/categorii" },
              { "@type": "ListItem", position: 3, name: catName, item: `https://rentli.ro/categorie/${category.slug}` },
            ],
          },
        },
        ...(categoryFaq.length > 0 ? [{
          "@type": "FAQPage",
          mainEntity: categoryFaq.map((f) => ({
            "@type": "Question",
            name: language === "en" ? f.qEn : f.q,
            acceptedAnswer: { "@type": "Answer", text: language === "en" ? f.aEn : f.a },
          })),
        }] : []),
      ],
    } : null,
  });



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
  const handleJudetChange = (value: string) => {
    setSelectedJudet(value);
    updateParam("judet", value);
    // Reset city if it no longer belongs to the new județ
    const j = judete.find((x) => x.name === value);
    if (!j || !j.localitati.includes(selectedCity)) {
      setSelectedCity("all");
      updateParam("localitate", "all");
    }
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
  const handleViewChange = (value: "map" | "gallery" | "list") => {
    setViewMode(value);
    const np = new URLSearchParams(searchParams);
    np.set("view", value);
    setSearchParams(np, { replace: true });
    try { localStorage.setItem("rentli:categoryView", value); } catch {}
  };
  const handleClearFilters = () => {
    setSelectedSubcategory("all");
    setSelectedJudet("all");
    setSelectedCity("all");
    setPriceRange(priceBounds);
    setPriceTouched(false);
    setSortBy("relevance");
    const np = new URLSearchParams(searchParams);
    np.delete("subcategorie");
    np.delete("judet");
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
      <MobileFixedBackButton />
      {viewMode !== "map" && (
        <CategoryHero
          name={catName}
          bannerImage={bannerImage}
          total={products.length}
          newThisWeek={newThisWeek}
          topCity={topCity}
        />
      )}
      <main className={viewMode === "map" ? "w-full px-4 pt-4 lg:px-8" : "container py-8"}>
        <div className="mb-6 max-w-2xl">
          <div className="relative">
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
            <Select
              value={selectedCity}
              onValueChange={handleCityChange}
              disabled={selectedJudet === "all"}
            >
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
          {/* Mobile-only: map/grid/list toggle on the left */}
          <div className="flex lg:hidden items-center gap-1 rounded-lg border border-border p-1">
            <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("map")} aria-label={t("Hartă", "Map")}>
              <MapIcon className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("gallery")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <InlineSearchFilters
              selectedCategory="all"
              onCategoryChange={() => {}}
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              selectedJudet={selectedJudet}
              onJudetChange={handleJudetChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              priceMin={priceBounds[0]}
              priceMax={priceBounds[1]}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              subcategoryOptions={subcategoryOptions}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={handleSubcategoryChange}
              hideLocation
            />
            <div className="hidden lg:flex items-center gap-1 rounded-lg border border-border p-1">
              <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("map")} aria-label={t("Hartă", "Map")}>
                <MapIcon className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("gallery")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => handleViewChange("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="lg:hidden">
              <SearchFilters
                selectedCategory="all"
                onCategoryChange={() => {}}
                selectedCity={selectedCity}
                onCityChange={handleCityChange}
                selectedJudet={selectedJudet}
                onJudetChange={handleJudetChange}
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
                priceMin={priceBounds[0]}
                priceMax={priceBounds[1]}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                subcategoryOptions={subcategoryOptions}
                selectedSubcategory={selectedSubcategory}
                onSubcategoryChange={handleSubcategoryChange}
              />
            </div>
          </div>
        </div>
        {searchQuery && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {searchesAllCategories
                ? t(`Rezultate pentru „${searchQuery}” din toate categoriile`, `Results for "${searchQuery}" across all categories`)
                : t(`Rezultate pentru „${searchQuery}” doar în ${catName}`, `Results for "${searchQuery}" only in ${catName}`)}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setRestrictToCategory((v) => !v)}>
              {searchesAllCategories
                ? t(`Caută doar în ${catName}`, `Search only in ${catName}`)
                : t("Caută în toate categoriile", "Search all categories")}
            </Button>
          </div>
        )}
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
          {viewMode !== "map" && isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {viewMode !== "map" && !isLoading && filteredProducts.length > 0 && (
            <div className={viewMode === "gallery" ? "grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode === "list" ? "list" : "gallery"} />
              ))}
            </div>
          )}
          {viewMode !== "map" && !isLoading && filteredProducts.length === 0 && (
            products.length > 0 && hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-foreground">
                  {t(
                    "Niciun rezultat cu filtrele curente",
                    "No results with the current filters",
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    `Există ${products.length} anunțuri în această categorie.`,
                    `There are ${products.length} listings in this category.`,
                  )}
                </p>
                <Button className="mt-4" onClick={handleClearFilters}>
                  {t("Resetează filtrele", "Reset filters")}
                </Button>
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

        {category && (
          <CategorySeoContent
            categorySlug={category.slug}
            heading={language === "en" ? `About renting ${catName.toLowerCase()}` : `Despre închirierea de ${catName.toLowerCase()}`}
          />
        )}

      </main>
      {viewMode !== "map" && <Footer />}
    </div>
  );
};

export default CategoryDetail;