import { Link } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import { usePublicUserProducts } from "@/hooks/queries/useProducts";
import ProductCard from "@/components/products/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface OwnerOtherListingsProps {
  ownerId: string;
  currentProductId: string;
  ownerName: string;
}

const OwnerOtherListings = ({ ownerId, currentProductId, ownerName }: OwnerOtherListingsProps) => {
  const { data: products, isLoading } = usePublicUserProducts(ownerId);
  const { language } = useLanguage();

  const otherProducts = products?.filter(p => p.id !== currentProductId)?.slice(0, 6);

  if (isLoading || !otherProducts || otherProducts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {language === "ro"
            ? `Mai multe anunțuri de la ${ownerName}`
            : `More listings from ${ownerName}`}
        </h2>
        <Link
          to={`/utilizator/${ownerId}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {language === "ro" ? "Vezi toate" : "View all"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {otherProducts.map(product => (
          <div key={product.id} className="min-w-[220px] max-w-[260px] flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerOtherListings;
