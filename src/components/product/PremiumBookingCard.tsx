import { useMemo } from "react";
import { format, differenceInDays, isBefore } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Shield, Clock, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDateBooked } from "@/hooks/queries/useBookedDates";
import { computeRentalPrice } from "@/lib/rentalPricing";

interface Props {
  clientPrice: number;
  priceWeek: number;
  priceMonth: number;
  startDate?: Date;
  endDate?: Date;
  bookedDates: Date[];
  onSelectDate: (d: Date | undefined) => void;
  onClear: () => void;
  onReserve: () => void;
  onAsk: () => void;
  isOwnProduct?: boolean;
  responseMinutes?: number | null;
  ownerVerified?: boolean;
  compact?: boolean;
}

const PremiumBookingCard = ({
  clientPrice, priceWeek, priceMonth, startDate, endDate, bookedDates,
  onSelectDate, onClear, onReserve, onAsk, isOwnProduct,
  responseMinutes, ownerVerified, compact,
}: Props) => {
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;

  const rentalDays = useMemo(() => (startDate && endDate) ? differenceInDays(endDate, startDate) + 1 : 0, [startDate, endDate]);
  const breakdown = useMemo(() => computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth), [rentalDays, clientPrice, priceWeek, priceMonth]);
  const totalPrice = breakdown.total;

  const responseLabel = responseMinutes && responseMinutes > 0
    ? responseMinutes < 60
      ? t(`Răspunde în ~${Math.round(responseMinutes)} min`, `Replies in ~${Math.round(responseMinutes)} min`)
      : t(`Răspunde în ~${Math.round(responseMinutes / 60)} h`, `Replies in ~${Math.round(responseMinutes / 60)} h`)
    : t("Răspuns rapid", "Fast reply");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
      {/* Price hero */}
      <div className="p-5 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-3xl font-bold text-foreground">{clientPrice}</span>
          <span className="text-base font-semibold text-foreground">RON</span>
          <span className="text-muted-foreground text-sm">/ {t("zi", "day")}</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span><b className="text-foreground">{priceWeek}</b> RON / {t("săpt", "wk")}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span><b className="text-foreground">{priceMonth}</b> RON / {t("lună", "mo")}</span>
        </div>
      </div>

      {/* Trust strip */}
      <div className="mx-5 mb-3 grid grid-cols-3 gap-2 rounded-xl bg-primary/5 p-2.5 text-[11px] font-medium text-foreground">
        <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" />{t("Plată sigură", "Secure")}</div>
        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /><span className="truncate">{responseLabel}</span></div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{ownerVerified ? t("Verificat", "Verified") : t("Activ", "Active")}</div>
      </div>

      {/* Calendar */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4" />{t("Selectează perioada", "Select dates")}
          </h3>
          {(startDate || endDate) && <button onClick={onClear} className="text-xs text-primary hover:underline">{t("Șterge", "Clear")}</button>}
        </div>
        <CalendarComponent
          mode="single"
          selected={endDate || startDate}
          onSelect={onSelectDate}
          disabled={d => isBefore(d, new Date()) || isDateBooked(d, bookedDates)}
          modifiers={{
            start: startDate,
            end: endDate,
            range: startDate && endDate ? { from: startDate, to: endDate } : undefined,
            today: new Date(),
          }}
          modifiersStyles={{
            start: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            end: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            range: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            today: { backgroundColor: "#000", color: "#fff", borderRadius: "10px", fontWeight: 700 },
          }}
          classNames={{ day_selected: "!bg-[#FA8729] !text-white !rounded-[10px] !opacity-100" }}
          className="rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs [&_.rdp-day]:rounded-[10px]"
        />
      </div>

      {/* Breakdown */}
      {startDate && endDate && (
        <div className="mx-5 mb-3 rounded-xl bg-muted/60 p-3.5 text-sm animate-fade-in">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("Început", "Start")}</span>
            <span className="font-medium">{format(startDate, "d MMM yyyy", { locale: dateLocale })}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">{t("Sfârșit", "End")}</span>
            <span className="font-medium">{format(endDate, "d MMM yyyy", { locale: dateLocale })}</span>
          </div>
          <Separator className="my-2.5" />
          {breakdown.months > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">{breakdown.months} × 30 {t("zile", "days")} × {priceMonth} RON</span><span className="font-medium">{breakdown.months * priceMonth} RON</span></div>
          )}
          {breakdown.weeks > 0 && (
            <div className="flex justify-between mt-1"><span className="text-muted-foreground text-xs">{breakdown.weeks} × 7 {t("zile", "days")} × {priceWeek} RON</span><span className="font-medium">{breakdown.weeks * priceWeek} RON</span></div>
          )}
          {breakdown.days > 0 && (
            <div className="flex justify-between mt-1"><span className="text-muted-foreground text-xs">{breakdown.days} {t("zile", "days")} × {clientPrice} RON</span><span className="font-medium">{Math.round(breakdown.days * clientPrice * 100) / 100} RON</span></div>
          )}
          <div className="flex justify-between mt-2.5 font-semibold text-base"><span>{t("Total", "Total")}</span><span className="text-primary">{totalPrice} RON</span></div>
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-border bg-card p-4 space-y-2">
        <Button
          className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
          size="lg"
          disabled={!startDate || !endDate || isOwnProduct}
          onClick={onReserve}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {startDate && endDate ? t("Rezervă acum", "Reserve now") : t("Verifică datele", "Check dates")}
        </Button>
        {!isOwnProduct && (
          <Button variant="outline" className="w-full" onClick={onAsk}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("Întreabă proprietarul", "Ask the owner")}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground pt-1">
          {t("Nu se încasează nimic acum. Suma e blocată sigur.", "Nothing charged yet. Funds held safely.")}
        </p>
      </div>
    </div>
  );
};

export default PremiumBookingCard;
