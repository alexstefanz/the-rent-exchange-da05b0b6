import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { getCategoryById } from "@/data/categories";
import { useProducts } from "@/hooks/queries/useProducts";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const category = getCategoryById(Number(id));
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto py-8 px-[10px] md:px-6 lg:px-8">
        <Link
          to="/categorii"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {copy.categoryDetail.backToCategories}
        </Link>

        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground text-center md:text-left md:text-4xl">
            {catName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.categoryDetail.subcategoriesAvailable(category.subcategories.length)}
            {!isLoading && products.length > 0 && ` • ${copy.categoryDetail.listings(products.length)}`}
          </p>
        </div>

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
