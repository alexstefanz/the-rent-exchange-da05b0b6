import { CheckCircle2, Clock, XCircle, Package, RotateCcw, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isRentalPaidLike, type RentalContextRow } from "@/features/messaging/messagingApi";
import { cn } from "@/lib/utils";

type Tone = "success" | "pending" | "danger" | "neutral";
export interface RentalStatusInfo { ro: string; en: string; tone: Tone; icon: typeof CheckCircle2 }

export function getRentalStatus(r: Pick<RentalContextRow, "status" | "payment_status" | "paid_at" | "handover_confirmed_at" | "return_confirmed_at" | "cancelled_at">): RentalStatusInfo {
  const s = (r.status || "").toLowerCase();
  if (r.cancelled_at || ["cancelled", "declined", "rejected", "expired"].includes(s))
    return { ro: "Anulat", en: "Cancelled", tone: "danger", icon: XCircle };
  if (r.return_confirmed_at || s === "completed" || s === "returned")
    return { ro: "Returnat", en: "Returned", tone: "neutral", icon: RotateCcw };
  if (r.handover_confirmed_at || s === "active" || s === "ongoing")
    return { ro: "Închiriere activă", en: "Active rental", tone: "success", icon: Package };
  if (isRentalPaidLike(r.payment_status, r.paid_at))
    return { ro: "Plată efectuată", en: "Paid", tone: "success", icon: CheckCircle2 };
  if (["approved", "accepted", "confirmed"].includes(s))
    return { ro: "Aprobat", en: "Approved", tone: "pending", icon: ThumbsUp };
  return { ro: "Cerere trimisă", en: "Request sent", tone: "pending", icon: Clock };
}

const toneClass: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  pending: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function RentalStatusBadge({ rental, className }: { rental: Parameters<typeof getRentalStatus>[0]; className?: string }) {
  const { t } = useLanguage();
  const info = getRentalStatus(rental);
  const Icon = info.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", toneClass[info.tone], className)}>
      <Icon className="h-3.5 w-3.5" />
      {t(info.ro, info.en)}
    </span>
  );
}
