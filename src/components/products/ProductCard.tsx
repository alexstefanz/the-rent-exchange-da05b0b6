import { Link } from "react-router-dom";
import { MapPin, CheckCircle, Heart } from "lucide-react";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  viewMode?: "gallery" | "list";
}

const ProductCard = ({ product, viewMode = "gallery" }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const clientPrice = calculateClientPrice(
    product.daily_price_owner,
    product.platform_fee_percent
  );

  const imageUrl = product.images?.[0] || "/placeholder.svg";
  const location = product.location_city || "România";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  if (viewMode === "list") {
    return (
      <Link
        to={`/produs/${product.id}`}
        className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[4/3] sm:aspect-square sm:w-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Verified badge */}
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm">
              <CheckCircle className="h-3 w-3" />
              <span>Verificat</span>
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
      to={`/produs/${product.id}`}
      className="group relative block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <img
          src={imageUrl}
          alt={product.title}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
        {/* Verified badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm">
          <CheckCircle className="h-3 w-3" />
          <span className="hidden sm:inline">Verificat</span>
        </div>
        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
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
