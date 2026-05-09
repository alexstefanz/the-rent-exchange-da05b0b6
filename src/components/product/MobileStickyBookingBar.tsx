import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
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
}

const MobileStickyBookingBar = (props: Props) => {
  const { language, t } = useLanguage();
  const { clientPrice, startDate, endDate } = props;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-lg font-bold text-foreground">{clientPrice}</span>
            <span className="text-sm text-muted-foreground">RON / {t("zi", "day")}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {startDate && endDate ? t("Datele alese", "Dates selected") : t("Selectează datele", "Pick dates")}
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="h-11 px-6 font-semibold">
              {startDate && endDate ? t("Rezervă", "Reserve") : t("Verifică", "Check dates")}
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
      </div>
    </div>
  );
};

export default MobileStickyBookingBar;
