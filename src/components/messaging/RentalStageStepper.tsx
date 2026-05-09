import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface StageRental {
  status: string;
  payment_status?: string;
  paid_at?: string | null;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  cancelled_at?: string | null;
}

interface Props {
  rental: StageRental | null | undefined;
}

export function RentalStageStepper({ rental }: Props) {
  const { t } = useLanguage();
  if (!rental) return null;

  const cancelled = rental.status === "cancelled" || !!rental.cancelled_at;

  const steps = [
    { key: "request", label: t("Cerere", "Request") },
    { key: "approved", label: t("Aprobat", "Approved") },
    { key: "paid", label: t("Plătit", "Paid") },
    { key: "handover", label: t("Predare", "Pickup") },
    { key: "returned", label: t("Returnat", "Returned") },
  ];

  let currentIdx = 0;
  if (rental.status === "pending") currentIdx = 0;
  if (rental.status === "confirmed" || rental.status === "approved") currentIdx = 1;
  if (rental.paid_at || rental.payment_status === "captured" || rental.payment_status === "authorized") currentIdx = Math.max(currentIdx, 2);
  if (rental.handover_confirmed_at || rental.status === "active") currentIdx = Math.max(currentIdx, 3);
  if (rental.return_confirmed_at || rental.status === "completed") currentIdx = 4;

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/60 backdrop-blur-sm overflow-x-auto">
      {steps.map((s, i) => {
        const done = !cancelled && i < currentIdx;
        const current = !cancelled && i === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                cancelled && "bg-foreground text-background",
                done && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                current && "bg-primary text-primary-foreground shadow-sm",
                !cancelled && !done && !current && "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center h-4 w-4 rounded-full text-[9px]",
                  cancelled ? "bg-background/20" : done ? "bg-emerald-500 text-white" : current ? "bg-primary-foreground/25" : "bg-background/60"
                )}
              >
                {cancelled ? <X className="h-2.5 w-2.5" /> : done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="w-3 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}