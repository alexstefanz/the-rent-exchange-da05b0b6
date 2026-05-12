import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  clientPrice: number;
  rating?: number | null;
  reviewCount?: number;
  triggerRef: React.RefObject<HTMLElement>;
  onReserve: () => void;
  isOwnProduct?: boolean;
}

const StickyProductHeader = ({ title, clientPrice, rating, reviewCount, triggerRef, onReserve, isOwnProduct }: Props) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: "0px 0px -100% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [triggerRef]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 hidden lg:block bg-card/95 backdrop-blur-md border-b border-border transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}
      aria-hidden={!visible}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-foreground truncate">{title}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {rating != null && rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="font-medium text-foreground">{Number(rating).toFixed(1)}</span>
                {reviewCount ? <span>({reviewCount})</span> : null}
              </span>
            )}
            <span>·</span>
            <span>{t("Anulare gratuită 24h", "Free cancellation 24h")}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-base font-bold text-foreground">{clientPrice} {t("RON", "RON")}<span className="text-xs font-normal text-muted-foreground"> / {t("zi", "day")}</span></div>
          </div>
          {!isOwnProduct && (
            <Button onClick={onReserve} size="sm" className="h-10 px-5 font-semibold">
              {t("Rezervă", "Reserve")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyProductHeader;