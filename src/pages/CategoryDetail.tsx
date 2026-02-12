import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SubcategoryCard from "@/components/items/SubcategoryCard";
import ProductCard from "@/components/products/ProductCard";
import { getCategoryById } from "@/data/categories";
import { useProducts } from "@/hooks/queries/useProducts";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const CategoryDetail = () => {
  const { id } = useParams();
  const category = getCategoryById(Number(id));
  const copy = useUxCopy();
  const { language } = useLanguage();
  
  const { data: products = [], isLoading } = useProducts(
    category ? { category: category.name } : undefined
  );

  const catName = category ? (language === "en" ? category.nameEn : category.name) : "";

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
          <div className="flex items-center gap-4">
            <span className="hidden text-5xl md:block">{category.icon}</span>
            <div className="w-full">
              <div className="flex items-center gap-3">
                <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground md:flex">
                  {category.id}
                </span>
                <h1 className="font-heading text-3xl font-bold text-foreground text-center md:text-left md:text-4xl">
                  {catName}
                </h1>
              </div>
              <p className="mt-2 text-muted-foreground">
                {copy.categoryDetail.subcategoriesAvailable(category.subcategories.length)}
                {!isLoading && products.length > 0 && ` • ${copy.categoryDetail.listings(products.length)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
            {copy.categoryDetail.subcategories}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {category.subcategories.map((subcategory, index) => (
              <div
                key={subcategory.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
              >
                <SubcategoryCard
                  id={subcategory.id}
                  name={subcategory.name}
                  nameEn={subcategory.nameEn}
                  description={subcategory.description}
                  image={subcategory.image}
                  categoryId={category.id}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
            {copy.categoryDetail.listingsInCategory}
          </h2>

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
