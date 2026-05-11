import { Check, Send, ThumbsUp, Truck, Package, RotateCcw, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface RentalForTimeline {
  status: string;
  payment_status?: string | null;
  start_date?: string;
  end_date: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  refunded_at?: string | null;
  cancelled_at?: string | null;
  dispute_status?: "none" | "open" | "resolved" | null;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function isLastDayOrPast(endDate?: string | null) {
  if (!endDate) return false;
  return startOfDay(new Date(endDate)).getTime() <= startOfDay(new Date()).getTime();
}

/**
 * Simplified 6-step rental timeline.
 * 1. Cerere trimisă        — pending, payment not authorized yet
 * 2. Cerere aprobată       — payment authorized OR confirmed before pickup window
 * 3. Predare produs        — confirmed/active before handover
 * 4. Produs în folosire    — handover_confirmed_at set, end_date not reached
 * 5. Returnare produs      — end_date reached, no return confirm yet
 * 6. Finalizat             — completed OR return_confirmed_at set
 */
export function getTimelineStep(rental: RentalForTimeline): { current: number; cancelled: boolean } {
  if (rental.status === "cancelled") return { current: 2, cancelled: true };
  if (rental.status === "completed" || rental.return_confirmed_at) return { current: 6, cancelled: false };
  if (rental.handover_confirmed_at || rental.status === "active") {
    if (isLastDayOrPast(rental.end_date)) return { current: 5, cancelled: false };
    return { current: 4, cancelled: false };
  }
  if (rental.status === "confirmed") {
    return { current: 3, cancelled: false };
  }
  if (rental.payment_status === "authorized" || rental.payment_status === "paid") {
    return { current: 2, cancelled: false };
  }
  return { current: 1, cancelled: false };
}

const STEPS = [
  { icon: Send, ro: "Cerere trimisă", en: "Request sent" },
  { icon: ThumbsUp, ro: "Cerere aprobată", en: "Approved" },
  { icon: Truck, ro: "Predare produs", en: "Hand-over" },
  { icon: Package, ro: "Produs în folosire", en: "In use" },
  { icon: RotateCcw, ro: "Returnare produs", en: "Return" },
  { icon: CheckCircle2, ro: "Finalizat", en: "Completed" },
] as const;

interface Props {
  rental: RentalForTimeline;
  className?: string;
}

const RentalTimeline = ({ rental, className }: Props) => {
  const { language } = useLanguage();
  const { current, cancelled } = getTimelineStep(rental);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const completedAll = current === STEPS.length && !cancelled;
          const isPast = !cancelled && (stepNum < current || completedAll);
          const isActive = stepNum === current && !cancelled && !completedAll;
          const isCancel = cancelled && stepNum === current;
          const isFuture = stepNum > current;
          const Icon = isCancel ? X : isPast ? Check : s.icon;

          return (
            <div key={s.ro} className="flex flex-1 flex-col items-center min-w-0">
              <div className="flex w-full items-center">
                <div className={cn(
                  "h-[2px] flex-1 transition-all duration-700",
                  idx === 0 ? "opacity-0" : isPast || isActive ? "bg-emerald-500" : "bg-border",
                )} />
                <div className={cn(
                  "relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isPast && "bg-emerald-500 border-emerald-500 text-white",
                  isActive && "bg-[#F98715] border-[#F98715] text-white animate-[soft-pulse_3.2s_ease-in-out_infinite]",
                  isCancel && "bg-rose-500 border-rose-500 text-white",
                  isFuture && "bg-muted border-border text-muted-foreground",
                )}>
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <div className={cn(
                  "h-[2px] flex-1 transition-all duration-700",
                  idx === STEPS.length - 1 ? "opacity-0" : (isPast && stepNum < current) || completedAll ? "bg-emerald-500" : "bg-border",
                )} />
              </div>
              <span className={cn(
                "mt-2 text-[10px] sm:text-[11px] text-center leading-tight px-0.5 truncate w-full",
                isActive ? "text-[#F98715] font-semibold" : isPast ? "text-emerald-700" : "text-muted-foreground",
              )}>
                {language === "ro" ? s.ro : s.en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RentalTimeline;
