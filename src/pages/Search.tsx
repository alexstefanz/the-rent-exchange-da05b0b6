import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, Loader2, User, LayoutGrid, List } from "lucide-react";
// cache-bust: re-emit module after stale HMR timestamp
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SearchFilters, { InlineSearchFilters } from "@/components/search/SearchFilters";
import EmptySearchState from "@/components/search/EmptySearchState";
import { useProducts } from "@/hooks/queries/useProducts";
import { useSearchUsers } from "@/hooks/queries/useSearch";
import { ProductFilters, calculateClientPrice } from "@/features/products/productsApi";
import { useUxCopy } from "@/hooks/useUxCopy";
import { judete } from "@/data/romaniaLocations";

const Search = () => {
  const copy = useUxCopy();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categorie") || "";
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";
  const tabParam = searchParams.get("tab") || "products";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [selectedJudet, setSelectedJudet] = useState(judetFilter || "all");
  const [selectedCity, setSelectedCity] = useState(localitateFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");

  const productFilters = useMemo((): ProductFilters => {
    const filters: ProductFilters = {};
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategory && selectedCategory !== "all") filters.category = selectedCategory;
    if (selectedCity && selectedCity !== "all") filters.location_city = selectedCity;
    return filters;
  }, [searchQuery, selectedCategory, selectedCity]);

  const { data: products = [], isLoading } = useProducts(productFilters);
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
    result = result.filter((p) => { const cp = calculateClientPrice(p.daily_price_owner, p.platform_fee_percent); return cp >= priceRange[0] && cp <= priceRange[1]; });
    if (sortBy === "price_asc") result.sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    else if (sortBy === "price_desc") result.sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    return result;
  }, [products, judetCitiesSet, selectedCity, priceRange, sortBy]);

  const { data: users = [], isLoading: isLoadingUsers } = useSearchUsers(searchQuery);
  const hasActiveFilters = (selectedCategory && selectedCategory !== "all") || (selectedJudet && selectedJudet !== "all") || (selectedCity && selectedCity !== "all") || priceRange[0] > 0 || priceRange[1] < 1000 || sortBy !== "relevance";
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
    setSelectedCategory("all"); setSelectedJudet("all"); setSelectedCity("all"); setPriceRange([0, 1000]); setSortBy("relevance");
    const np = new URLSearchParams(searchParams);
    np.delete("judet");
    np.delete("localitate");
    setSearchParams(np, { replace: true });
  };
  const handleSearchChange = (value: string) => { setSearchQuery(value); const np = new URLSearchParams(searchParams); if (value) np.set("q", value); else np.delete("q"); setSearchParams(np, { replace: true }); };
  const handleTabChange = (value: string) => { setActiveTab(value); const np = new URLSearchParams(searchParams); np.set("tab", value); setSearchParams(np, { replace: true }); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{copy.search_page.title}</h1>
          <p className="mt-1 text-muted-foreground">{searchQuery ? copy.search_page.searchFor(searchQuery) : copy.search_page.allProducts}</p>
        </div>
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder={copy.search.placeholder} value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="h-12 pl-12 text-base" />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                {copy.search_page.products}
                {!isLoading && filteredProducts.length > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{filteredProducts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                {copy.search_page.users}
                {!isLoadingUsers && users.length > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{users.length}</span>}
              </TabsTrigger>
            </TabsList>
            {activeTab === "products" && (
              <div className="flex items-center gap-2">
                <InlineSearchFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedCity={selectedCity} onCityChange={handleCityChange} selectedJudet={selectedJudet} onJudetChange={handleJudetChange} priceRange={priceRange} onPriceRangeChange={setPriceRange} sortBy={sortBy} onSortByChange={setSortBy} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters} />
                <SearchFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedCity={selectedCity} onCityChange={handleCityChange} selectedJudet={selectedJudet} onJudetChange={handleJudetChange} priceRange={priceRange} onPriceRangeChange={setPriceRange} sortBy={sortBy} onSortByChange={setSortBy} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters} />
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-1">
                  <Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("gallery")}><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
          <TabsContent value="products" className="mt-0">
              <div className="min-w-0">
                {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {!isLoading && filteredProducts.length > 0 && (
                  <div>
                    <p className="mb-4 text-sm text-muted-foreground">{copy.search.resultsCount(filteredProducts.length)}</p>
                    <div className={viewMode === "gallery" ? "grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
                      {filteredProducts.map((product) => <ProductCard key={product.id} product={product} viewMode={viewMode} />)}
                    </div>
                  </div>
                )}
                {!isLoading && filteredProducts.length === 0 && <EmptySearchState searchQuery={searchQuery} type="products" />}
              </div>
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            {isLoadingUsers && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {!isLoadingUsers && users.length > 0 && (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">{copy.search_page.userFound(users.length)}</p>
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Link key={user.id} to={`/utilizator/${user.id}`} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                      <img src={user.avatar_url || "/placeholder.svg"} alt={user.full_name || copy.search_page.user} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{user.full_name || copy.search_page.user}</h3>
                        <p className="text-sm text-muted-foreground">{copy.search_page.listings(user.products_count)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {!isLoadingUsers && users.length === 0 && <EmptySearchState searchQuery={searchQuery} type="users" />}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Search;
