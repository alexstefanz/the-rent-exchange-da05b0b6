import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNearbyProducts, Product, calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";

interface NearbyProductsSliderProps {
  currentProductId: string;
  locationCity: string | null;
  category: string | null;
}

const NearbyProductsSlider = ({ currentProductId, locationCity, category }: NearbyProductsSliderProps) => {
  const copy = useUxCopy();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await getNearbyProducts(currentProductId, locationCity, category);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching nearby products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentProductId, locationCity, category]);

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("nearby-products-slider");
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => { setScrollPosition(e.currentTarget.scrollLeft); };

  if (isLoading || products.length === 0) return null;

  const title = locationCity ? copy.nearby.listingsFrom(locationCity) : copy.nearby.similarListings;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
          {title}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </h2>
        <div className="hidden md:flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scrollContainer("left")} disabled={scrollPosition <= 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scrollContainer("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="nearby-products-slider" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x snap-mandatory" onScroll={handleScroll} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {products.map((product) => (
          <NearbyProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const NearbyProductCard = ({ product }: { product: Product }) => {
  const copy = useUxCopy();
  const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
  const imageUrl = product.images?.[0] || "/placeholder.svg";
  const location = product.location_city || "România";

  return (
    <Link to={getProductUrl(product)} className="group flex-shrink-0 w-[200px] md:w-[220px] snap-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#F7F6F2] p-2">
        <div className="w-full h-full rounded-[30px] bg-white flex items-center justify-center overflow-hidden px-[15px] py-3">
          <img src={imageUrl} alt={product.title} className="max-h-[65%] max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105" />
        </div>
        <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors" onClick={(e) => { e.preventDefault(); }}>
          <Heart className="h-4 w-4 text-foreground" />
        </button>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm line-clamp-1">{product.title}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-foreground" />
            <span className="text-foreground">4.9</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{location}</span>
        </div>
        <p className="mt-1 text-sm">
          <span className="font-semibold text-foreground">{clientPrice} RON</span>
          <span className="text-muted-foreground"> {copy.common.perDay}</span>
        </p>
      </div>
    </Link>
  );
};

export default NearbyProductsSlider;
