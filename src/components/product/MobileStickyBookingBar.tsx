import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { computeRentalPrice } from "@/lib/rentalPricing";
import { formatPriceShort } from "@/lib/utils";
import PremiumBookingCard from "./PremiumBookingCard";

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
  minRentalDays?: number | null;
  maxRentalDays?: number | null;
  platformFeePercent?: number;
}

const MobileStickyBookingBar = (props: Props) => {
  const { language, t } = useLanguage();
  const { clientPrice, ownerPrice, priceWeek, priceMonth, startDate, endDate, onReserve, onAsk, isOwnProduct, platformFeePercent = 0 } = props;
  const dateLocale = language === "ro" ? ro : enUS;

  const hasDates = !!(startDate && endDate);
  const rentalDays = useMemo(() => (hasDates ? differenceInDays(endDate!, startDate!) + 1 : 0), [hasDates, startDate, endDate]);
  const totalPrice = useMemo(
    () => (hasDates ? computeRentalPrice(rentalDays, ownerPrice ?? clientPrice, priceWeek, priceMonth, platformFeePercent).total : 0),
    [hasDates, rentalDays, ownerPrice, clientPrice, priceWeek, priceMonth, platformFeePercent],
  );

  if (isOwnProduct) return null;

  return (
    <div
      className="lg:hidden fixed left-3 right-3 z-[60] rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]"
      style={{ bottom: "calc(4rem + 28px + env(safe-area-inset-bottom))" }}
    >
      <div className="px-3 pt-1.5 pb-1.5 flex flex-col gap-1.5">
        {/* Row 1: dates + total */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {hasDates ? (
              <>
                <div className="font-semibold text-xs text-foreground truncate">
                  {format(startDate!, "d MMM", { locale: dateLocale })} – {format(endDate!, "d MMM", { locale: dateLocale })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {rentalDays} {t(rentalDays === 1 ? "zi" : "zile", rentalDays === 1 ? "day" : "days")}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-xs text-foreground">{t("Selectează datele", "Pick dates")}</div>
                <div className="text-[10px] text-muted-foreground">{t("pentru a vedea totalul", "to see total")}</div>
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            {hasDates ? (
              <>
                <div className="font-heading text-base font-bold text-foreground leading-none">
                  {formatPriceShort(totalPrice)} RON
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("total", "total")}</div>
              </>
            ) : (
              <>
                <div className="font-heading text-base font-bold text-foreground leading-none">
                  {formatPriceShort(clientPrice)} RON
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">/ {t("zi", "day")}</div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: buttons side by side */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-full text-xs font-semibold bg-white/70 border-white/70 backdrop-blur" onClick={onAsk}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            {t("Întreabă", "Ask")}
          </Button>
          {hasDates ? (
            <Button size="sm" className="h-9 rounded-full text-xs font-semibold shadow-[0_6px_20px_-4px_rgba(249,135,21,0.45)]" onClick={onReserve}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {t("Rezervă acum", "Reserve now")}
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" className="h-9 rounded-full text-xs font-semibold shadow-[0_6px_20px_-4px_rgba(249,135,21,0.45)]">
                  <CalendarCheck className="h-3.5 w-3.5 mr-1" />
                  {t("Verifică datele", "Check dates")}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[92dvh] p-0 overflow-y-auto rounded-t-2xl">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{t("Detalii rezervare", "Booking details")}</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <PremiumBookingCard {...props} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileStickyBookingBar;
