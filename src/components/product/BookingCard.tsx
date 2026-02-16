import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isBefore } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Heart, Info, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import TrustIndicators from "@/components/trust/TrustIndicators";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  productId: string;
  title: string;
  images: string[];
  clientPrice: number;
  priceWeek: number;
  priceMonth: number;
  location: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  showTitle?: boolean;
}

const BookingCard = ({
  productId, title, images, clientPrice, priceWeek, priceMonth,
  location, isFavorite, onFavoriteToggle, showTitle = true,
}: BookingCardProps) => {
  const navigate = useNavigate();
  const copy = useUxCopy();
  const { language } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(undefined);
    } else if (isBefore(date, startDate)) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const clearDates = () => { setStartDate(undefined); setEndDate(undefined); };

  const rentalDays = useMemo(() => {
    if (startDate && endDate) return differenceInDays(endDate, startDate) + 1;
    return 0;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    if (rentalDays === 0) return 0;
    if (rentalDays >= 30) return Math.ceil(rentalDays / 30) * priceMonth;
    if (rentalDays >= 7) {
      const weeks = Math.floor(rentalDays / 7);
      const extraDays = rentalDays % 7;
      return weeks * priceWeek + extraDays * clientPrice;
    }
    return rentalDays * clientPrice;
  }, [rentalDays, clientPrice, priceWeek, priceMonth]);

  const handleBooking = () => {
    if (startDate && endDate) {
      navigate('/checkout', {
        state: { product: { id: productId, title, images, price: clientPrice, priceUnit: "zi", location }, startDate, endDate, rentalDays, totalPrice }
      });
    }
  };

  return (
    <div className="sticky top-24 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
      {showTitle && (
        <>
          <div className="flex items-start justify-between gap-3 mb-3 lg:hidden">
            <h1 className="font-heading text-[25px] font-semibold text-foreground leading-tight flex-1">{title}</h1>
            <button onClick={onFavoriteToggle} className="flex-shrink-0 mt-1">
              <Heart className={cn("h-6 w-6 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>
          </div>
          <h1 className="hidden lg:block font-heading text-2xl font-semibold text-foreground mb-3">{title}</h1>
        </>
      )}

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-2xl font-bold text-primary">{clientPrice} RON</span>
          <span className="text-muted-foreground">{copy.common.perDay}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>{priceWeek} RON / {copy.productDetail.week}</p>
          <p>{priceMonth} RON / {copy.productDetail.month}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {copy.booking.steps.period}
          </h3>
          {(startDate || endDate) && (
            <button onClick={clearDates} className="text-xs text-primary hover:underline">
              {copy.common.clear}
            </button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={endDate || startDate}
          onSelect={handleDateSelect}
          disabled={(date) => isBefore(date, new Date())}
          locale={dateLocale}
          formatters={{ formatDay: (date) => date.getDate().toString() }}
          modifiers={{ start: startDate, end: endDate, range: startDate && endDate ? { from: startDate, to: endDate } : undefined }}
          modifiersStyles={{
            start: { backgroundColor: "#46B95B", color: "white", borderRadius: "50%" },
            end: { backgroundColor: "#46B95B", color: "white", borderRadius: "50%" },
            range: { backgroundColor: "rgba(70, 185, 91, 0.15)", color: "#1a1a1a" },
          }}
          className="rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs"
        />
      </div>

      {startDate && endDate && (
        <div className="mb-4 rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{copy.booking.priceBreakdown.perDay}:</span>
            <span className="font-medium">{format(startDate, "d MMM yyyy", { locale: dateLocale })}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">{copy.productDetail.untilLabel}:</span>
            <span className="font-medium">{format(endDate, "d MMM yyyy", { locale: dateLocale })}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{rentalDays} {copy.booking.priceBreakdown.days} × {clientPrice} RON</span>
            <span className="font-medium">{totalPrice} RON</span>
          </div>
          <div className="flex justify-between mt-2 font-semibold">
            <span>{copy.booking.priceBreakdown.total}</span>
            <span className="text-primary">{totalPrice} RON</span>
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!startDate || !endDate} onClick={handleBooking}>
        {startDate && endDate ? copy.booking.ctaPrimary : copy.booking.steps.period}
      </Button>

      <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Info className="h-3 w-3" />
        {copy.booking.reassurance}
      </p>

      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>{copy.booking.freeCancellation}</span>
        </div>
        <TrustIndicators variant="vertical" size="sm" />
      </div>
    </div>
  );
};

export default BookingCard;
