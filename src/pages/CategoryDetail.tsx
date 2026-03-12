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

            <Select onValueChange={(val) => navigate(`/subcategorie/${val}`)}>
              <SelectTrigger className="w-full sm:w-[240px]">
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
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="py-8 text-center rounded-xl bg-muted/30">
              <p className="text-muted-foreground">
                {copy.categoryDetail.noListings}
              </p>
              <Button asChild className="mt-4">
                <Link to="/adauga-anunt">{copy.categoryDetail.addFirstListing}</Link>
              </Button>
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
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
