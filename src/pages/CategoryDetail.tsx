import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { getCategoryBySlug } from "@/data/categories";
import { useProducts } from "@/hooks/queries/useProducts";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const CategoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const category = getCategoryBySlug(slug || "");
  const copy = useUxCopy();
  const { language } = useLanguage();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  
  const { data: products = [], isLoading } = useProducts(
    category ? { category: category.name } : undefined
  );

  const catName = category ? (language === "en" ? category.nameEn : category.name) : "";

  // Count products per subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.subcategory) {
        counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const price = p.daily_price_owner;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.daily_price_owner - b.daily_price_owner);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.daily_price_owner - a.daily_price_owner);
    }

    return result;
  }, [products, priceRange, sortBy]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {copy.categoryDetail.categoryNotFound}
          </h1>
          <Button asChild className="mt-4">
            <Link to="/categorii">{copy.categoryDetail.backToCategories}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Use high-res version for the full-width banner
  const rawImage = category.subcategories[0]?.image || "";
  const bannerImage = rawImage.includes("unsplash.com")
    ? rawImage.replace(/w=\d+/, "w=1920").replace(/q=\d+/, "q=85")
    : rawImage;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src={bannerImage}
          alt={catName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <Link
            to="/categorii"
            className="mb-4 inline-flex items-center text-sm text-white/80 transition-colors hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {copy.categoryDetail.backToCategories}
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl drop-shadow-lg">
            {catName}
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base">
            {copy.categoryDetail.subcategoriesAvailable(category.subcategories.length)}
            {!isLoading && products.length > 0 && ` • ${copy.categoryDetail.listings(products.length)}`}
          </p>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto py-8 px-[10px] md:px-6 lg:px-8">

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {copy.categoryDetail.listingsInCategory}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={(val) => navigate(`/subcategorie/${val}`)}>
                <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
                  <SelectValue placeholder={language === "en" ? "Subcategories" : "Subcategorii"} />
                </SelectTrigger>
                <SelectContent>
                  {category.subcategories.map((sub) => {
                    const subName = language === "en" && sub.nameEn ? sub.nameEn : sub.name;
                    const count = subcategoryCounts[sub.name] || 0;
                    return (
                      <SelectItem key={sub.id} value={sub.id}>
                        {subName} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-sm font-normal gap-1">
                    {priceRange[0] === 0 && priceRange[1] === 1000
                      ? (language === "en" ? "Price range" : "Interval preț")
                      : `${priceRange[0]} - ${priceRange[1]} RON`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{language === "en" ? "Price range" : "Interval preț"}</p>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{priceRange[0]} RON</span>
                      <span>{priceRange[1]} RON</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-auto min-w-[130px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{language === "en" ? "Relevance" : "Relevanță"}</SelectItem>
                  <SelectItem value="price_asc">{language === "en" ? "Price ascending" : "Preț crescător"}</SelectItem>
                  <SelectItem value="price_desc">{language === "en" ? "Price descending" : "Preț descrescător"}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-md border border-input">
                <Button
                  variant={viewMode === "gallery" ? "default" : "ghost"}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-r-none"
                  onClick={() => setViewMode("gallery")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="py-8 text-center rounded-xl bg-muted/30">
              <p className="text-muted-foreground">
                {copy.categoryDetail.noListings}
              </p>
              <Button asChild className="mt-4">
                <Link to="/adauga-anunt">{copy.categoryDetail.addFirstListing}</Link>
              </Button>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className={viewMode === "gallery" ? "grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryDetail;
