import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, differenceInDays, isBefore } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Heart, ChevronRight } from "lucide-react";
import { useBookedDates, isDateBooked, hasBookedDateInRange } from "@/hooks/queries/useBookedDates";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn, formatPriceShort } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsBanned } from "@/hooks/useIsBanned";
import { Ban } from "lucide-react";
import BookedDatesAlert from "@/components/product/BookedDatesAlert";

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
  const routerLocation = useLocation();
  const copy = useUxCopy();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isBanned } = useIsBanned();
  const dateLocale = language === "ro" ? ro : enUS;
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [conflictDates, setConflictDates] = useState<Date[]>([]);
  const [conflictOpen, setConflictOpen] = useState(false);

  const { bookedDates } = useBookedDates(productId);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDateBooked(date, bookedDates)) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(undefined);
    } else if (date.getTime() === startDate.getTime()) {
      setEndDate(date);
    } else if (isBefore(date, startDate)) {
      setStartDate(date);
    } else {
      if (hasBookedDateInRange(startDate, date, bookedDates)) {
        setConflictDates(bookedDates.filter((d) => d >= startDate && d <= date));
        setConflictOpen(true);
        return;
      }
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
    return rentalDays * clientPrice;
  }, [rentalDays, clientPrice]);

  const priceBreakdown = useMemo(() => {
    if (rentalDays === 0) return { months: 0, weeks: 0, days: 0 };
    const months = Math.floor(rentalDays / 30);
    const afterMonths = rentalDays % 30;
    const weeks = Math.floor(afterMonths / 7);
    const days = afterMonths % 7;
    return { months, weeks, days };
  }, [rentalDays]);

  const handleBooking = () => {
    if (startDate && endDate) {
      navigate('/checkout', {
        state: { product: { id: productId, title, images, price: clientPrice, priceUnit: "zi", location }, startDate, endDate, rentalDays, totalPrice }
      });
    }
  };

  const ctaLabel = isBanned
    ? "Cont suspendat"
    : (!startDate || !endDate
        ? copy.booking.steps.period
        : copy.booking.ctaPrimary);

  return (
    <div className="sticky top-24 rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-3 sm:p-4 lg:p-4">
      {showTitle && (
        <>
          <div className="flex items-start justify-between gap-3 mb-2 lg:hidden">
            <p className="font-heading text-xl font-semibold text-foreground leading-tight flex-1">{title}</p>
            <button onClick={onFavoriteToggle} className="flex-shrink-0 mt-1">
              <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>
          </div>
          <p className="hidden lg:block font-heading text-lg font-semibold text-foreground mb-2 leading-tight">{title}</p>
        </>
      )}

      <div className="mb-3 flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-xl font-bold text-primary">{formatPriceShort(clientPrice)} RON</span>
          <span className="text-xs text-muted-foreground">{copy.common.perDay}</span>
        </div>
      </div>

      <div className="mb-3">
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
          disabled={(date) => isBefore(date, new Date()) || isDateBooked(date, bookedDates)}
          locale={dateLocale}
          formatters={{ formatDay: (date) => date.getDate().toString() }}
          modifiers={{ start: startDate, end: endDate, range: startDate && endDate ? { from: startDate, to: endDate } : undefined, booked: (d: Date) => isDateBooked(d, bookedDates) }}
          modifiersClassNames={{ booked: "!bg-destructive !text-destructive-foreground !opacity-100 rounded-lg cursor-not-allowed" }}
          className="rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs [&_.rdp-day[aria-selected]]:rounded-lg"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-primary" />
            {language === "ro" ? "Selectat" : "Selected"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-destructive" />
            <span>{language === "ro" ? "Rezervat" : "Booked"}</span>
          </span>
        </div>
      </div>

      {startDate && endDate && (
        <div className="mb-3 rounded-lg bg-muted p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span>{format(startDate, "d MMM yyyy", { locale: dateLocale })}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>{format(endDate, "d MMM yyyy", { locale: dateLocale })}</span>
          </div>
          <div className="flex justify-between items-baseline font-semibold">
            <span>
              {copy.booking.priceBreakdown.total}{" "}
              <span className="font-normal text-muted-foreground text-sm">
                ({rentalDays} {language === "ro" ? (rentalDays === 1 ? "zi" : "zile") : (rentalDays === 1 ? "day" : "days")})
              </span>
            </span>
            <span className="text-primary">{formatPriceShort(totalPrice)} RON</span>
          </div>
        </div>
      )}

        {isBanned && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
            <Ban className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.5} />
            <span>Contul tău este suspendat și nu poate face rezervări noi.</span>
          </div>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={!startDate || !endDate || isBanned}
          onClick={handleBooking}
        >
          {ctaLabel}
        </Button>
      </div>
      <BookedDatesAlert
        open={conflictOpen}
        dates={conflictDates}
        onClose={() => {
          setConflictOpen(false);
          setStartDate(undefined);
          setEndDate(undefined);
        }}
      />
    </div>
  );
};

export default BookingCard;
