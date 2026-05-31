import { format, differenceInDays } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { MapPin, ShieldCheck, FileCheck2, Lock, CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { calcPlatformFee } from "@/lib/rentalPricing";

interface Props {
  product: {
    title: string;
    images: string[];
    price: number;
    location: string;
    platformFeePercent?: number;
  };
  startDate: Date;
  endDate: Date;
  rentalDays: number;
  /** Owner-net subtotal (dailyPrice × rentalDays). */
  totalPrice: number;
}

const PremiumBookingSummary = ({ product, startDate, endDate, rentalDays, totalPrice }: Props) => {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const subtotal = totalPrice;
  const platformFee = calcPlatformFee(subtotal, product.platformFeePercent ?? 0);
  const total = Math.round((subtotal + platformFee) * 100) / 100;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white font-semibold text-lg drop-shadow truncate">{product.title}</h3>
          <div className="flex items-center gap-1 text-white/90 text-xs mt-0.5">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{product.location}</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Period */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{t("Început", "Start")}</div>
            <div className="mt-1 font-semibold text-foreground text-sm">
              {format(startDate, "d MMM yyyy", { locale })}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{t("Sfârșit", "End")}</div>
            <div className="mt-1 font-semibold text-foreground text-sm">
              {format(endDate, "d MMM yyyy", { locale })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 -mt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
            <CalendarDays className="h-3 w-3" />
            {rentalDays} {t("zile", "days")}
          </span>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {product.price} RON × {rentalDays} {t("zile", "days")}
            </span>
            <span className="text-foreground">{fmt(subtotal)} RON</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("Comision Rentli", "Platform fee")}</span>
            {platformFee > 0 ? (
              <span className="text-foreground">{fmt(platformFee)} RON</span>
            ) : (
              <span className="text-emerald-600 font-medium">{t("Gratuit", "Free")}</span>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-foreground">{t("Total", "Total")}</span>
          <span className="font-bold text-2xl text-foreground tabular-nums">
            {fmt(total)} <span className="text-base font-medium text-muted-foreground">RON</span>
          </span>
        </div>

        {/* Trust mini */}
        <div className="pt-2 grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t("Plată securizată — bani blocați în custodie", "Secure payment — funds held in escrow")}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t("Proces verbal digital inclus", "Digital handover report included")}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t("Anulare gratuită până la 24h înainte", "Free cancellation up to 24h before")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumBookingSummary;