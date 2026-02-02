import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, Loader2, User, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SearchFilters from "@/components/search/SearchFilters";
import EmptySearchState from "@/components/search/EmptySearchState";
import { useProducts } from "@/hooks/queries/useProducts";
import { useSearchUsers } from "@/hooks/queries/useSearch";
import { ProductFilters, calculateClientPrice } from "@/features/products/productsApi";
import { uxCopy } from "@/data/uxCopy";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categorie") || "";
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";
  const tabParam = searchParams.get("tab") || "products";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");

  // Build filters for products query
  const productFilters = useMemo((): ProductFilters => {
    const filters: ProductFilters = {};
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategory && selectedCategory !== "all") filters.category = selectedCategory;
    if (localitateFilter && localitateFilter !== "all") {
      filters.location_city = localitateFilter;
    } else if (judetFilter && judetFilter !== "all") {
      filters.location_city = judetFilter;
    }
    return filters;
  }, [searchQuery, selectedCategory, judetFilter, localitateFilter]);

  // Use React Query for products
  const { data: products = [], isLoading } = useProducts(productFilters);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by price range
    result = result.filter((product) => {
      const clientPrice = calculateClientPrice(
        product.daily_price_owner,
        product.platform_fee_percent
      );
      return clientPrice >= priceRange[0] && clientPrice <= priceRange[1];
    });

    // Sort products
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    }

    return result;
  }, [products, priceRange, sortBy]);

  // Use React Query for users
  const { data: users = [], isLoading: isLoadingUsers } = useSearchUsers(searchQuery);

  // Check if filters are active
  const hasActiveFilters = 
    (selectedCategory && selectedCategory !== "all") || 
    priceRange[0] > 0 || 
    priceRange[1] < 1000 ||
    sortBy !== "relevance";

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setSortBy("relevance");
  };

  // Update URL when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("q", value);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams, { replace: true });
  };

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Rezultatele Căutării
          </h1>
          <p className="mt-1 text-muted-foreground">
            {searchQuery ? `Căutare pentru: "${searchQuery}"` : "Toate produsele disponibile"}
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={uxCopy.search.placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-12 pl-12 text-base"
            />
          </div>
        </div>

        {/* Tabs for Products and Users */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                Produse
                {!isLoading && filteredProducts.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {filteredProducts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                Utilizatori
                {!isLoadingUsers && users.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {users.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* View mode toggle - only for products */}
            {activeTab === "products" && (
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <div className="lg:hidden">
                  <SearchFilters
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    onClearFilters={handleClearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-1">
                  <Button
                    variant={viewMode === "gallery" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode("gallery")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0">
            <div className="flex gap-8">
              {/* Desktop Filters Sidebar */}
              <SearchFilters
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />

              {/* Results */}
              <div className="flex-1">
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Products Results */}
                {!isLoading && filteredProducts.length > 0 && (
                  <div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {uxCopy.search.resultsCount(filteredProducts.length)}
                    </p>
                    <div className={
                      viewMode === "gallery"
                        ? "grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3"
                        : "flex flex-col gap-4"
                    }>
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && filteredProducts.length === 0 && (
                  <EmptySearchState searchQuery={searchQuery} type="products" />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            {/* Loading State */}
            {isLoadingUsers && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Users Results */}
            {!isLoadingUsers && users.length > 0 && (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">
                  {users.length} {users.length === 1 ? "utilizator găsit" : "utilizatori găsiți"}
                </p>
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/utilizator/${user.id}`}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
                    >
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.full_name || "Utilizator"}
                        className="w-14 h-14 rounded-full object-cover border-2 border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {user.full_name || "Utilizator"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.products_count} {user.products_count === 1 ? "anunț" : "anunțuri"} active
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoadingUsers && users.length === 0 && (
              <EmptySearchState searchQuery={searchQuery} type="users" />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
