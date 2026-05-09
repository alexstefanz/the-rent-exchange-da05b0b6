import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";

export interface TransactionCardData {
  publicId?: string | null;
  productTitle: string;
  productImage?: string | null;
  startDate: string;
  endDate: string;
  rentalDays: number;
  subtotal?: number | null;
  status: string;
  paymentStatus?: string | null;
  role?: "renter" | "owner";
}

function statusVariant(status: string): { className: string; label: { ro: string; en: string } } {
  switch (status) {
    case "pending":
      return { className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20", label: { ro: "În așteptare", en: "Pending" } };
    case "confirmed":
    case "approved":
      return { className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20", label: { ro: "Confirmat", en: "Confirmed" } };
    case "active":
      return { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", label: { ro: "Activă", en: "Active" } };
    case "completed":
      return { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", label: { ro: "Finalizată", en: "Completed" } };
    case "cancelled":
      return { className: "bg-foreground text-background", label: { ro: "Anulată", en: "Cancelled" } };
    default:
      return { className: "bg-muted text-muted-foreground", label: { ro: status, en: status } };
  }
}

export function TransactionCard({ data }: { data: TransactionCardData }) {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const variant = statusVariant(data.status);
  const link = data.role === "owner" ? "/inchirieri" : "/rezervari";

  return (
    <div className="mx-4 my-3 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex gap-3 p-3">
        {data.productImage ? (
          <img
            src={data.productImage}
            alt={data.productTitle}
            className="h-16 w-16 rounded-xl object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm truncate">{data.productTitle}</p>
            <Badge variant="outline" className={`shrink-0 text-[10px] ${variant.className}`}>
              {language === "ro" ? variant.label.ro : variant.label.en}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(data.startDate), "d MMM", { locale })}
            {" – "}
            {format(new Date(data.endDate), "d MMM yyyy", { locale })}
            {" · "}
            {data.rentalDays} {data.rentalDays === 1 ? t("zi", "day") : t("zile", "days")}
          </p>
          {typeof data.subtotal === "number" && (
            <p className="text-sm font-semibold text-primary mt-1">{data.subtotal.toLocaleString("ro-RO")} RON</p>
          )}
        </div>
      </div>
      {link && (
        <Link to={link} className="block">
          <Button variant="ghost" className="w-full justify-between rounded-none border-t h-10 text-xs">
            {t("Vezi detalii rezervare", "View booking details")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}