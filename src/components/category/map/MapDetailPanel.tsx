import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { getProductUrl } from "@/lib/slugUtils";
import { getDisplayTitle, getDisplayDescription } from "@/lib/productI18n";
import { useLanguage } from "@/contexts/LanguageContext";
import MapProductCard from "./MapProductCard";

interface Props {
  product: Product;
  similar: Product[];
  onBack: () => void;
  onSelectSimilar: (id: string) => void;
}

const MapDetailPanel = ({ product, similar, onBack, onSelectSimilar }: Props) => {
  const { t, language } = useLanguage();
  const title = getDisplayTitle(product, language);
  const description = getDisplayDescription(product, language);
  const price = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 px-2">
          <ArrowLeft className="h-4 w-4" />
          {t("Înapoi la rezultate", "Back to results")}
        </Button>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <article className="overflow-hidden rounded-2xl border border-border bg-card">
          <Link to={getProductUrl(product)} className="block">
            <img
              src={getOptimizedImageUrl(product.images?.[0] || "/placeholder.svg", "card")}
              alt={title}
              className="aspect-[16/10] w-full object-cover"
              loading="lazy"
            />
          </Link>
          <div className="p-4">
            <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{product.location_city || t("România", "Romania")}</span>
            </div>
            {description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{description}</p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <span className="font-heading text-2xl font-bold text-foreground">{price} RON</span>
                <span className="text-sm text-muted-foreground"> / {t("zi", "day")}</span>
              </div>
              <Button asChild>
                <Link to={getProductUrl(product)}>{t("Vezi anunțul", "View listing")}</Link>
              </Button>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {t(
                "Locația afișată pe hartă este aproximativă. Adresa exactă este disponibilă după confirmarea rezervării.",
                "The location shown on the map is approximate. The exact address is shared after the booking is confirmed.",
              )}
            </p>
          </div>
        </article>

        {similar.length > 0 && (
          <section className="mt-6">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {t("Anunțuri similare în apropiere", "Similar listings nearby")}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6">
              {similar.map((p) => (
                <div key={p.id} onMouseEnter={() => onSelectSimilar(p.id)}>
                  <MapProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MapDetailPanel;
