import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export type EarningsStatus =
  | "available"
  | "pending"
  | "held"
  | "withdraw_initiated"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled";

const palette: Record<EarningsStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15",
  pending: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15",
  held: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15",
  withdraw_initiated: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/15",
  processing: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/15 animate-pulse",
  paid: "bg-emerald-600 text-white hover:bg-emerald-600",
  failed: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  cancelled: "bg-slate-500/15 text-slate-700 hover:bg-slate-500/15",
};

export const StatusBadge = ({ status }: { status: EarningsStatus }) => {
  const { t } = useLanguage();
  const labels: Record<EarningsStatus, string> = {
    available: t("Disponibil", "Available"),
    pending: t("În așteptare", "Pending"),
    held: t("Blocat", "Held"),
    withdraw_initiated: t("Retragere inițiată", "Withdrawal initiated"),
    processing: t("Procesare", "Processing"),
    paid: t("Plătit", "Paid"),
    failed: t("Eșuat", "Failed"),
    cancelled: t("Anulat", "Cancelled"),
  };
  return <Badge variant="secondary" className={`font-medium border-0 ${palette[status]}`}>{labels[status]}</Badge>;
};

export default StatusBadge;