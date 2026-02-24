import { Link } from "react-router-dom";
import { MapPin, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/queries/useProducts";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductRow = ({
  title,
  products,
  copy,
}: {
  title: string;
  products: any[];
  copy: any;
}) => {
  if (products.length === 0) return null;

  return (
    <div className="mb-10 last:mb-0">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {title}
        </h2>
        <Button variant="ghost" asChild className="hidden md:flex">
          <Link to="/cauta">
            {copy.common.viewAll}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
        {products.map((product) => {
          const clientPrice = calculateClientPrice(
            product.daily_price_owner,
            product.platform_fee_percent
          );
          const imageUrl = product.images?.[0] || "/placeholder.svg";
          const location = product.location_city || "România";

          return (
            <Link
              key={product.id}
              to={getProductUrl(product)}
              className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">{copy.trust.verified}</span>
                </div>
              </div>
              <div className="p-3 md:p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-2 md:text-base">
                  {product.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
                <div className="mt-2 md:mt-3">
                  <span className="font-heading text-base font-bold text-primary md:text-lg">
                    {clientPrice} RON
                  </span>
                  <span className="text-xs text-muted-foreground md:text-sm">
                    {copy.common.perDay}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const FeaturedListings = () => {
  const { data: products, isLoading } = useProducts();
  const copy = useUxCopy();
  const { language } = useLanguage();

  const allProducts = products || [];
  const popularProducts = allProducts.slice(0, 5);
  const topCategoryProducts = allProducts.slice(0, 5);
  const recentProducts = [...allProducts].reverse().slice(0, 5);
  const bestReviewedProducts = allProducts.slice(0, 5);

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (allProducts.length === 0) return null;

  const sections = [
    {
      title: copy.home.featuredListings,
      products: popularProducts,
    },
    {
      title: language === "en" ? "Most Searched Categories" : "Cele mai căutate categorii",
      products: topCategoryProducts,
    },
    {
      title: language === "en" ? "Most Recent" : "Cele mai recente",
      products: recentProducts,
    },
    {
      title: language === "en" ? "Best Reviews" : "Cele mai bune review-uri",
      products: bestReviewedProducts,
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {sections.map((section) => (
          <ProductRow
            key={section.title}
            title={section.title}
            products={section.products}
            copy={copy}
          />
        ))}

        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/cauta">
              {copy.common.viewAll}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
