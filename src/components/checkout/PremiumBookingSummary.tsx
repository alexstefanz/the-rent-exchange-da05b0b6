import { format, differenceInDays } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { MapPin, ShieldCheck, FileCheck2, Clock, CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { calcFullBreakdown } from "@/lib/rentalPricing";

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
  const { subtotal, platformFee, stripeFee, total } = calcFullBreakdown(totalPrice, product.platformFeePercent ?? 0);
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
        {/* Handover highlight */}
        <div className="rounded-xl bg-primary/10 p-3 flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{t("Predare", "Handover")}</div>
            <div className="font-semibold text-foreground text-sm capitalize">
              {format(startDate, "EEEE, d MMMM", { locale })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("Perioada", "Period")}</span>
          <span className="font-medium text-foreground">
            {format(startDate, "d MMM", { locale })} – {format(endDate, "d MMM yyyy", { locale })} · {rentalDays} {t("zile", "days")}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("Locație", "Location")}</span>
          <span className="font-medium text-foreground truncate ml-3">{product.location}</span>
        </div>

        <Separator />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("Chirie", "Rent")}</span>
            <span className="tabular-nums">{fmt(subtotal + platformFee)} RON</span>
          </div>
          {platformFee > 0 && (
            <p className="text-[11px] text-muted-foreground -mt-1">
              {t(`Include ${fmt(platformFee)} RON taxe operaționale`, `Includes ${fmt(platformFee)} RON operational fees`)}
            </p>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("Service fee Stripe", "Stripe service fee")}</span>
            <span className="tabular-nums">{fmt(stripeFee)} RON</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-foreground">{t("Total estimat", "Estimated total")}</span>
          <span className="font-bold text-2xl text-foreground tabular-nums">
            {fmt(total)} <span className="text-base font-medium text-muted-foreground">RON</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {t("0 RON achitați acum · plătești doar după acceptarea proprietarului", "0 RON now · you pay only after the owner accepts")}
        </p>

        <Separator />

        {/* What happens next */}
        <ol className="space-y-3 text-sm">
          {[
            { icon: Clock, title: t("Proprietarul confirmă", "Owner confirms"), desc: t("Răspunde în maximum 24h.", "Replies within 24h.") },
            { icon: ShieldCheck, title: t("Plată sigură în custodie", "Secure escrow payment"), desc: t("Banii sunt blocați până primești bunul.", "Funds are held until you receive the item.") },
            { icon: FileCheck2, title: t("Predare cu PV digital", "Digital handover report"), desc: t("Fotografiați produsul și semnați PV-ul pe telefon.", "Photograph the item and sign the report on your phone.") },
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PremiumBookingSummary;