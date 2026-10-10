import { useMemo } from "react";
import { format, differenceInDays, isBefore } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Shield, Clock, CheckCircle2, MessageCircle, CalendarCheck } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDateBooked } from "@/hooks/queries/useBookedDates";
import { computeRentalPrice } from "@/lib/rentalPricing";
import { formatPriceShort } from "@/lib/utils";

interface Props {
  clientPrice: number;
  /** Owner-net daily price used for totals; clientPrice is display-only (fee included). */
  ownerPrice?: number;
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
  minRentalDays?: number | null;
  maxRentalDays?: number | null;
  platformFeePercent?: number;
}

const PremiumBookingCard = ({
  clientPrice, ownerPrice, priceWeek, priceMonth, startDate, endDate, bookedDates,
  onSelectDate, onClear, onReserve, onAsk, isOwnProduct,
  responseMinutes, ownerVerified, compact, minRentalDays, maxRentalDays,
  platformFeePercent = 0,
}: Props) => {
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;

  const rentalDays = useMemo(() => (startDate && endDate) ? differenceInDays(endDate, startDate) + 1 : 0, [startDate, endDate]);
  const breakdown = useMemo(
    () => computeRentalPrice(rentalDays, ownerPrice ?? clientPrice, priceWeek, priceMonth, platformFeePercent),
    [rentalDays, ownerPrice, clientPrice, priceWeek, priceMonth, platformFeePercent],
  );
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
          <span className="font-heading text-3xl font-bold text-foreground">{formatPriceShort(clientPrice)}</span>
          <span className="text-base font-semibold text-foreground">RON</span>
          <span className="text-muted-foreground text-sm">/ {t("zi", "day")}</span>
        </div>
        {platformFeePercent > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("Comision Rentli inclus", "Rentli fee included")}
          </p>
        )}
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
          fromMonth={new Date()}
          disabled={d => isBefore(d, new Date()) || isDateBooked(d, bookedDates)}
          numberOfMonths={2}
          fixedWeeks
          showOutsideDays={false}
          modifiers={{
            start: startDate,
            end: endDate,
            range: startDate && endDate ? { from: startDate, to: endDate } : undefined,
            today: new Date(),
            past: (d: Date) => isBefore(d, new Date(new Date().setHours(0, 0, 0, 0))),
          }}
          modifiersStyles={{
            start: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            end: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            range: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" },
            today: { backgroundColor: "#000", color: "#fff", borderRadius: "10px", fontWeight: 700 },
          }}
          modifiersClassNames={{
            past: "day-past",
          }}
          classNames={{
            months: "flex flex-col gap-4 w-full booking-cal-months",
            month: "space-y-2 w-full booking-cal-month [&:not(:first-child)]:pt-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border",
            caption: "booking-cal-caption flex justify-center pt-1 relative items-center text-base font-semibold text-foreground",
            head_row: "booking-cal-headrow flex justify-between",
            row: "booking-cal-row flex w-full mt-2 justify-between",
            day_selected: "!bg-[#FA8729] !text-white !rounded-[10px] !opacity-100",
            day_outside: "!text-foreground !opacity-100",
            day_range_start: "!rounded-[10px]",
            day_range_end: "!rounded-[10px]",
            day_range_middle: "!rounded-[10px] !bg-[#FA8729] !text-white",
            cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          }}
          className="rdp-hide-past-weeks rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs [&_.rdp-day]:rounded-[10px]"
        />
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-[#FA8729]" />
            {t("Selectat", "Selected")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-foreground" />
            {t("Astăzi", "Today")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-muted border border-border line-through" />
            <span className="line-through opacity-70">{t("Rezervat", "Booked")}</span>
          </span>
        </div>
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {rentalDays} {language === "en" ? (rentalDays === 1 ? "day" : "days") : (rentalDays === 1 ? "zi" : "zile")} × {formatPriceShort(clientPrice)} RON
            </span>
            <span className="font-medium">{formatPriceShort(breakdown.subtotal + breakdown.platformFee)} RON</span>
          </div>
          {breakdown.platformFee > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t(`Include ${formatPriceShort(breakdown.platformFee)} RON taxe operaționale`, `Includes ${formatPriceShort(breakdown.platformFee)} RON operational fees`)}
            </p>
          )}
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">{t("Service fee Stripe", "Stripe service fee")}</span>
            <span className="font-medium">{formatPriceShort(breakdown.stripeFee)} RON</span>
          </div>
          <div className="flex justify-between mt-2.5 font-semibold text-base"><span>{t("Total", "Total")}</span><span className="text-primary">{formatPriceShort(totalPrice)} RON</span></div>
        </div>
      )}

      {/* CTA — hidden on mobile/tablet since sticky bar covers it */}
      <div className="border-t border-border bg-card p-4 space-y-2 hidden lg:block">
        <Button
          className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
          size="lg"
          disabled={!startDate || !endDate || isOwnProduct}
          onClick={onReserve}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          {isOwnProduct
            ? t("Nu poți rezerva propriul anunț", "You can't book your own listing")
            : startDate && endDate
              ? t("Rezervă acum", "Reserve now")
              : t("Verifică datele", "Check dates")}
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 font-medium"
          disabled={isOwnProduct}
          onClick={onAsk}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {t("Întreabă proprietarul", "Ask the owner")}
        </Button>
        <p className="text-center text-xs text-muted-foreground pt-1">
          {isOwnProduct
            ? t("Acesta este anunțul tău.", "This is your own listing.")
            : t("Nu se încasează nimic acum. Suma e blocată sigur.", "Nothing charged yet. Funds held safely.")}
        </p>
      </div>
    </div>
  );
};

export default PremiumBookingCard;
