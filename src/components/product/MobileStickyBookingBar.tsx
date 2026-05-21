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
}

const MobileStickyBookingBar = (props: Props) => {
  const { language, t } = useLanguage();
  const { clientPrice, priceWeek, priceMonth, startDate, endDate, onReserve, onAsk, isOwnProduct } = props;
  const dateLocale = language === "ro" ? ro : enUS;

  const hasDates = !!(startDate && endDate);
  const rentalDays = useMemo(() => (hasDates ? differenceInDays(endDate!, startDate!) + 1 : 0), [hasDates, startDate, endDate]);
  const totalPrice = useMemo(
    () => (hasDates ? computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth).total : 0),
    [hasDates, rentalDays, clientPrice, priceWeek, priceMonth],
  );

  if (isOwnProduct) return null;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="px-4 pt-3 pb-3 flex flex-col gap-2.5">
        {/* Row 1: dates + total */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {hasDates ? (
              <>
                <div className="font-semibold text-sm text-foreground truncate">
                  {format(startDate!, "d MMM", { locale: dateLocale })} – {format(endDate!, "d MMM", { locale: dateLocale })}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {rentalDays} {t(rentalDays === 1 ? "zi" : "zile", rentalDays === 1 ? "day" : "days")}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm text-foreground">{t("Selectează datele", "Pick dates")}</div>
                <div className="text-[11px] text-muted-foreground">{t("pentru a vedea totalul", "to see total")}</div>
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            {hasDates ? (
              <>
                <div className="font-heading text-lg font-bold text-foreground leading-none">
                  {formatPriceShort(totalPrice)} RON
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{t("total", "total")}</div>
              </>
            ) : (
              <>
                <div className="font-heading text-lg font-bold text-foreground leading-none">
                  {formatPriceShort(clientPrice)} RON
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">/ {t("zi", "day")}</div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: buttons side by side */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" className="h-11 font-semibold" onClick={onAsk}>
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {t("Întreabă", "Ask")}
          </Button>
          {hasDates ? (
            <Button size="lg" className="h-11 font-semibold" onClick={onReserve}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {t("Rezervă acum", "Reserve now")}
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg" className="h-11 font-semibold">
                  <CalendarCheck className="h-4 w-4 mr-1.5" />
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
