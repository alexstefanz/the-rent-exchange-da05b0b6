import { Check, Send, ThumbsUp, CreditCard, FileSignature, Package, RotateCcw, CheckCircle2, X } from "lucide-react";
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
  /** True when both PVs of the handover phase are signed. */
  handover_pv_signed?: boolean;
  /** True when the return has been initiated (renter clicked "Initiaza returnarea"). */
  return_initiated?: boolean;
  /** True when renter signed the return PV. Promotes timeline to step 6 (Returnare). */
  return_pv_renter_signed?: boolean;
  /** True when owner signed the return PV. Promotes timeline to step 7 (Finalizat). */
  return_pv_owner_signed?: boolean;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

/**
 * 7-step rental timeline.
 * 1. Cerere trimisă        — pending, owner has not responded yet
 * 2. Confirmat             — owner accepted the request, payment not yet captured/authorized
 * 3. Plată efectuată       — payment authorized (Stripe hold) OR paid
 * 4. Semnături PV          — handover PV is being signed by both parties
 * 5. Produs predat         — handover_confirmed_at set, item with renter
 * 6. Returnare             — return phase started (end of period or early-return)
 * 7. Finalizat             — completed OR return_confirmed_at set
 */
export function getTimelineStep(rental: RentalForTimeline): { current: number; cancelled: boolean } {
  if (rental.status === "cancelled") return { current: 2, cancelled: true };
  if (rental.return_pv_owner_signed) return { current: 7, cancelled: false };
  if (rental.status === "completed" || rental.return_confirmed_at) return { current: 7, cancelled: false };
  if (rental.return_pv_renter_signed) return { current: 6, cancelled: false };
  if (rental.handover_confirmed_at || rental.status === "active") {
    if (rental.return_initiated) return { current: 6, cancelled: false };
    return { current: 5, cancelled: false };
  }
  if (rental.status === "confirmed") {
    if (rental.handover_pv_signed) return { current: 5, cancelled: false };
    if (rental.payment_status === "authorized" || rental.payment_status === "paid") return { current: 4, cancelled: false };
    return { current: 2, cancelled: false };
  }
  if (rental.payment_status === "authorized" || rental.payment_status === "paid") {
    return { current: 3, cancelled: false };
  }
  return { current: 1, cancelled: false };
}

const STEPS = [
  { icon: Send, ro: "Cerere trimisă", en: "Request sent", roShort: "Cerere", enShort: "Request" },
  { icon: ThumbsUp, ro: "Confirmat", en: "Confirmed", roShort: "Confirmat", enShort: "Confirmed" },
  { icon: CreditCard, ro: "Plată efectuată", en: "Payment done", roShort: "Plată", enShort: "Payment" },
  { icon: FileSignature, ro: "Semnături PV", en: "PV signatures", roShort: "Semnături", enShort: "Signatures" },
  { icon: Package, ro: "Produs predat", en: "Handed over", roShort: "Predat", enShort: "Handover" },
  { icon: RotateCcw, ro: "Returnare", en: "Return", roShort: "Returnare", enShort: "Return" },
  { icon: CheckCircle2, ro: "Finalizat", en: "Completed", roShort: "Finalizat", enShort: "Done" },
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
                  "relative z-10 flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isPast && "bg-emerald-500 border-emerald-500 text-white",
                  isActive && "bg-[#F98715] border-[#F98715] text-white animate-[soft-pulse_5s_ease-in-out_infinite]",
                  isCancel && "bg-rose-500 border-rose-500 text-white",
                  isFuture && "bg-muted border-border text-muted-foreground",
                )}>
                  <Icon className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
                </div>
                <div className={cn(
                  "h-[2px] flex-1 transition-all duration-700",
                  idx === STEPS.length - 1 ? "opacity-0" : (isPast && stepNum < current) || completedAll ? "bg-emerald-500" : "bg-border",
                )} />
              </div>
              <span className={cn(
                "mt-2 text-[9px] sm:text-[11px] text-center leading-tight px-0.5 w-full break-words hyphens-auto",
                isActive ? "text-[#F98715] font-semibold" : isPast ? "text-emerald-700" : "text-muted-foreground",
              )}>
                <span className="sm:hidden">{language === "ro" ? s.roShort : s.enShort}</span>
                <span className="hidden sm:inline">{language === "ro" ? s.ro : s.en}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RentalTimeline;
