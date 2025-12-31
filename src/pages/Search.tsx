import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { getProducts, Product } from "@/features/products/productsApi";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categorie") || "";
  const judetFilter = searchParams.get("judet") || "";
  const localitateFilter = searchParams.get("localitate") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search products when query or filters change
  useEffect(() => {
    const searchProducts = async () => {
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

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, categoryFilter, judetFilter, localitateFilter]);

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
        <div className="mb-10">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută produse..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-14 pl-14 text-lg"
            />
          </div>
        </div>

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
      </main>

      <Footer />
    </div>
  );
};

export default Search;
