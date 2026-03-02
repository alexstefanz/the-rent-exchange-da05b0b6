import { Link } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import { usePublicUserProducts } from "@/hooks/queries/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";

interface OwnerOtherListingsProps {
  ownerId: string;
  currentProductId: string;
  ownerName: string;
}

const OwnerOtherListings = ({ ownerId, currentProductId, ownerName }: OwnerOtherListingsProps) => {
  const { data: products, isLoading } = usePublicUserProducts(ownerId);
  const { language } = useLanguage();

  const otherProducts = products?.filter(p => p.id !== currentProductId)?.slice(0, 5);

  if (isLoading || !otherProducts || otherProducts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
          <User className="h-4 w-4 text-primary" />
          {language === "ro"
            ? `Anunțuri de la ${ownerName}`
            : `Listings from ${ownerName}`}
        </h3>
        <Link
          to={`/utilizator/${ownerId}`}
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          {language === "ro" ? "Vezi toate" : "View all"}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {otherProducts.map(product => {
          const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
          const image = product.images?.[0] || "/placeholder.svg";
          return (
            <Link
              key={product.id}
              to={getProductUrl(product)}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-muted/50 -mx-1 px-1 rounded-md transition-colors"
            >
              <img
                src={image}
                alt={product.title}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0 bg-muted"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                <p className="text-xs text-muted-foreground">{product.location_city || "România"}</p>
              </div>
              <span className="text-sm font-semibold text-primary whitespace-nowrap">{clientPrice} RON<span className="text-xs font-normal text-muted-foreground">/zi</span></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerOtherListings;
