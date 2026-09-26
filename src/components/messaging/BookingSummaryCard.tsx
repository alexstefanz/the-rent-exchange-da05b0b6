import { Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RentalContextRow } from "@/features/messaging/messagingApi";
import { RentalStatusBadge } from "./RentalStatusBadge";

export function formatRentalPeriod(start: string, end: string, lang: string) {
  const loc = lang === "ro" ? ro : enUS;
  return `${format(new Date(start), "d MMM", { locale: loc })} – ${format(new Date(end), "d MMM yyyy", { locale: loc })}`;
}

export function formatRon(v: number) {
  return `${Number(v || 0).toFixed(2).replace(".", ",")} RON`;
}

export function rentalUrl(r: RentalContextRow, isOwner: boolean) {
  return `/${isOwner ? "inchirieri" : "rezervari"}/${r.public_id}`;
}

export function BookingSummaryCard({ rental, isOwner, fallbackTitle }: { rental: RentalContextRow; isOwner: boolean; fallbackTitle: string }) {
  const { t, language } = useLanguage();
  return (
    <Link
      to={rentalUrl(rental, isOwner)}
      className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3 shadow-sm transition-colors hover:bg-muted/40"
    >
      {rental.product_image ? (
        <img src={rental.product_image} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{rental.product_title || fallbackTitle}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatRentalPeriod(rental.start_date, rental.end_date, language)} · {rental.rental_days}{" "}
          {rental.rental_days === 1 ? t("zi", "day") : t("zile", "days")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <RentalStatusBadge rental={rental} />
        <span className="text-sm font-semibold">{formatRon(rental.subtotal)}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
