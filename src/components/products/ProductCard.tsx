import { Link } from "react-router-dom";
import { MapPin, CheckCircle, Heart } from "lucide-react";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProductUrl } from "@/lib/slugUtils";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  viewMode?: "gallery" | "list";
}

const ProductCard = ({ product, viewMode = "gallery" }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { user } = useAuth();
  const clientPrice = calculateClientPrice(
    product.daily_price_owner,
    product.platform_fee_percent
  );

  const imageUrl = product.images?.[0] || "/placeholder.svg";
  const location = product.location_city || "România";

  useEffect(() => {
    if (user) {
      isProductFavorite(product.id).then(setIsFavorite);
    }
  }, [user, product.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Trebuie să fii autentificat pentru a adăuga la favorite.", variant: "destructive" });
      return;
    }
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isFavorite) {
        await removeFavoriteProduct(product.id);
        setIsFavorite(false);
      } else {
        await addFavoriteProduct(product.id);
        setIsFavorite(true);
      }
    } catch {
      toast({ title: "Eroare la actualizarea favoritelor.", variant: "destructive" });
    } finally {
      setIsToggling(false);
    }
  };

  if (viewMode === "list") {
    return (
      <Link
        to={getProductUrl(product)}
        className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[4/3] sm:aspect-square sm:w-48 overflow-hidden bg-[#F7F6F2] p-2">
            <div className="w-full h-full rounded-[30px] bg-white flex items-center justify-center overflow-hidden p-3">
              <img
                src={imageUrl}
                alt={product.title}
                width={480}
                height={360}
                loading="lazy"
                decoding="async"
                className="max-h-[80%] max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <CheckCircle className="h-3.5 w-3.5 text-[#46B95B]" />
            </div>
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location}
              </div>
            </div>
            <div className="mt-4">
              <span className="font-heading text-xl font-bold text-primary">
                {clientPrice} RON
              </span>
              <span className="text-sm text-muted-foreground"> / zi</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={getProductUrl(product)}
      className="group relative block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F6F2] p-3">
        <div className="w-full h-full rounded-[30px] bg-white flex items-center justify-center overflow-hidden p-4">
          <img
            src={imageUrl}
            alt={product.title}
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className="max-h-[80%] max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <CheckCircle className="h-3.5 w-3.5 text-[#46B95B]" />
        </div>
        <button
          onClick={handleFavoriteClick}
          className={cn("absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors", isFavorite ? "bg-[#46B95B] hover:bg-[#3da550]" : "bg-white hover:bg-gray-100")}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 drop-shadow-sm transition-colors",
              isFavorite ? "text-white fill-white" : "text-[#46B95B]"
            )}
          />
        </button>
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-heading text-base md:text-lg font-semibold text-foreground line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-3">
          <span className="font-heading text-lg md:text-xl font-bold text-primary">
            {clientPrice} RON
          </span>
          <span className="text-xs md:text-sm text-muted-foreground"> / zi</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
