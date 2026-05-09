import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { MapPin, Clock } from "lucide-react";

interface Props { excludeId?: string; }

const RecentlyViewedSlider = ({ excludeId }: Props) => {
  const items = useRecentlyViewed(excludeId);
  const { t } = useLanguage();
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("Vizualizate recent", "Recently viewed")}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.slice(0, 5).map((it) => (
          <Link
            key={it.id}
            to={it.slug ? `/produs/${it.slug}` : `/produs/${it.id}`}
            className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              {it.image && (
                <img
                  src={getOptimizedImageUrl(it.image, "thumb")}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-foreground line-clamp-1">{it.title}</div>
              {it.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />{it.city}
                </div>
              )}
              <div className="text-sm font-bold text-primary mt-1">{it.price} {t("RON/zi", "RON/day")}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedSlider;