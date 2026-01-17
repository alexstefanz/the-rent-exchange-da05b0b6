import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { getProducts, Product } from "@/features/products/productsApi";
import { searchUsers, SearchedUser } from "@/features/profile/userSearchApi";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categorie") || "";
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";
  const tabParam = searchParams.get("tab") || "products";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam);

  // Search products when query or filters change
  useEffect(() => {
    const searchProductsAsync = async () => {
      setIsLoading(true);
      try {
        const filters: { search?: string; category?: string; city?: string } = {};
        
        if (searchQuery) filters.search = searchQuery;
        if (categoryFilter && categoryFilter !== "all") filters.category = categoryFilter;
        if (localitateFilter && localitateFilter !== "all") {
          filters.city = localitateFilter;
        } else if (judetFilter && judetFilter !== "all") {
          filters.city = judetFilter;
        }

        const data = await getProducts(filters);
        setProducts(data);
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProductsAsync, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, categoryFilter, judetFilter, localitateFilter]);

  // Search users when query changes
  useEffect(() => {
    const searchUsersAsync = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setIsLoadingUsers(true);
      try {
        const data = await searchUsers(searchQuery);
        setUsers(data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchUsersAsync, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Rezultatele Căutării
          </h1>
          <p className="mt-2 text-muted-foreground">
            {searchQuery ? `Căutare pentru: "${searchQuery}"` : "Toate produsele disponibile"}
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută produse sau utilizatori..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-14 pl-14 text-lg"
            />
          </div>
        </div>

        {/* Tabs for Products and Users */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2">
              Produse
              {!isLoading && products.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {products.length}
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

          {/* Products Tab */}
          <TabsContent value="products">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Products Results */}
            {!isLoading && products.length > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                  {products.length} {products.length === 1 ? "produs găsit" : "produse găsite"}
                </h2>
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {!isLoading && products.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  {searchQuery 
                    ? `Nu am găsit produse pentru "${searchQuery}"`
                    : "Nu există produse disponibile momentan"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Încearcă să cauți alt termen sau verifică mai târziu
                </p>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {/* Loading State */}
            {isLoadingUsers && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Users Results */}
            {!isLoadingUsers && users.length > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                  {users.length} {users.length === 1 ? "utilizator găsit" : "utilizatori găsiți"}
                </h2>
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/utilizator/${user.id}`}
                      className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.full_name || "Utilizator"}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
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
              </section>
            )}

            {/* No Results */}
            {!isLoadingUsers && users.length === 0 && (
              <div className="py-12 text-center">
                {searchQuery && searchQuery.length >= 2 ? (
                  <>
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">
                      Nu am găsit utilizatori pentru "{searchQuery}"
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Încearcă să cauți un alt nume
                    </p>
                  </>
                ) : (
                  <>
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">
                      Introdu minim 2 caractere pentru a căuta utilizatori
                    </p>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
