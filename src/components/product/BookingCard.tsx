import { useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { format, differenceInDays, isBefore } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Heart, ThumbsUp, ChevronRight } from "lucide-react";
import { useBookedDates, isDateBooked, hasBookedDateInRange } from "@/hooks/queries/useBookedDates";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useKycGate } from "@/hooks/queries/useKycGate";
import { useAuth } from "@/contexts/AuthContext";
import KycGateBanner from "@/components/kyc/KycGateBanner";

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
  const kyc = useKycGate();
  const dateLocale = language === "ro" ? ro : enUS;
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { bookedDates } = useBookedDates(productId);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDateBooked(date, bookedDates)) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(undefined);
    } else if (isBefore(date, startDate)) {
      setStartDate(date);
    } else {
      if (hasBookedDateInRange(startDate, date, bookedDates)) {
        toast({ title: language === "ro" ? "Perioada indisponibilă" : "Period unavailable", description: language === "ro" ? "Există zile rezervate în intervalul selectat." : "There are booked days in the selected range.", variant: "destructive" });
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
    const months = Math.floor(rentalDays / 30);
    const afterMonths = rentalDays % 30;
    const weeks = Math.floor(afterMonths / 7);
    const extraDays = afterMonths % 7;
    return months * priceMonth + weeks * priceWeek + extraDays * clientPrice;
  }, [rentalDays, clientPrice, priceWeek, priceMonth]);

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

  const needsKyc = !!user && !kyc.loading && !kyc.isVerified;
  const isPendingKyc = !!user && !kyc.loading && kyc.isPending;
  const ctaLabel = needsKyc
    ? (isPendingKyc
        ? (language === "ro" ? "În așteptare verificare" : "Awaiting verification")
        : (language === "ro" ? "Verifică identitatea pentru a rezerva" : "Verify identity to book"))
    : (!startDate || !endDate
        ? copy.booking.steps.period
        : copy.booking.ctaPrimary);

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
          disabled={(date) => isBefore(date, new Date()) || isDateBooked(date, bookedDates)}
          locale={dateLocale}
          formatters={{ formatDay: (date) => date.getDate().toString() }}
          modifiers={{ start: startDate, end: endDate, range: startDate && endDate ? { from: startDate, to: endDate } : undefined }}
          className="rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs [&_.rdp-day[aria-selected]]:rounded-lg"
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
          {priceBreakdown.months > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {priceBreakdown.months} × {language === "ro" ? "30 zile" : "30 days"} × {priceMonth} RON
              </span>
              <span className="font-medium">{priceBreakdown.months * priceMonth} RON</span>
            </div>
          )}
          {priceBreakdown.weeks > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">
                {priceBreakdown.weeks} {language === "ro"
                  ? (priceBreakdown.weeks === 1 ? "săptămână" : "săptămâni")
                  : (priceBreakdown.weeks === 1 ? "week" : "weeks")} × {priceWeek} RON
              </span>
              <span className="font-medium">{priceBreakdown.weeks * priceWeek} RON</span>
            </div>
          )}
          {priceBreakdown.days > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">
                {priceBreakdown.days} {language === "ro"
                  ? (priceBreakdown.days === 1 ? "zi" : "zile")
                  : (priceBreakdown.days === 1 ? "day" : "days")} × {clientPrice} RON
              </span>
              <span className="font-medium">{priceBreakdown.days * clientPrice} RON</span>
            </div>
          )}
          <div className="flex justify-between mt-2 font-semibold">
            <span>{copy.booking.priceBreakdown.total}</span>
            <span className="text-primary">{totalPrice} RON</span>
          </div>
        </div>
      )}

      {needsKyc && (
        <div className="mb-4">
          <KycGateBanner reason="book" nextHref={routerLocation.pathname} />
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!startDate || !endDate || needsKyc}
        onClick={handleBooking}
      >
        {ctaLabel}
      </Button>

      {startDate && endDate && (
        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2.5">
          <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {format(startDate, "dd MMM yyyy", { locale: dateLocale })}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {format(endDate, "dd MMM yyyy", { locale: dateLocale })}
          </span>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <ThumbsUp className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Anulare gratuită</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Poți anula gratuit în primele 48 de ore de la rezervare.
            </p>
            <Link
              to="/politica-anulare"
              className="text-xs text-primary hover:underline mt-1 inline-block font-medium"
            >
              Află mai multe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
