import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUxCopy } from "@/hooks/useUxCopy";

export interface RentalForTimeline {
  status: string;
  payment_status?: string | null;
  end_date: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  refunded_at?: string | null;
  cancelled_at?: string | null;
}

function isLastDayOrPast(endDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end.getTime() <= today.getTime();
}

export function getTimelineStep(rental: RentalForTimeline): { current: number; cancelled: boolean } {
  if (rental.status === "cancelled") return { current: 2, cancelled: true };
  if (rental.status === "completed" || rental.return_confirmed_at) return { current: 6, cancelled: false };
  if (rental.status === "active" && isLastDayOrPast(rental.end_date)) return { current: 5, cancelled: false };
  if (rental.status === "active" || rental.handover_confirmed_at) return { current: 4, cancelled: false };
  if (rental.status === "confirmed") return { current: 3, cancelled: false };
  return { current: 1, cancelled: false };
}

interface RentalTimelineProps {
  rental: RentalForTimeline;
  compact?: boolean;
  className?: string;
}

const RentalTimeline = ({ rental, compact = false, className }: RentalTimelineProps) => {
  const copy = useUxCopy();
  const { current, cancelled } = getTimelineStep(rental);

  const allSteps = [
    copy.timeline.requestSent,
    cancelled ? copy.timeline.requestRejected : copy.timeline.requestApproved,
    copy.timeline.inTransit,
    copy.timeline.inUse,
    copy.timeline.returning,
    copy.timeline.completed,
  ];

  // When cancelled, only show steps 1 (sent) + 2 (rejected). Hide subsequent steps.
  const steps = cancelled ? allSteps.slice(0, 2) : allSteps;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop / md+ horizontal */}
      <div className="hidden md:flex items-start justify-between gap-1">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = !cancelled && stepNum < current;
          const isCurrent = !cancelled && stepNum === current;
          const isCancelledStep = cancelled && stepNum === current;
          const isUpcoming = !isCompleted && !isCurrent && !isCancelledStep;

          return (
            <div key={stepNum} className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-center w-full">
                {/* left line */}
                <div className={cn(
                  "h-0.5 flex-1",
                  idx === 0 ? "opacity-0" : isCompleted || isCurrent || (cancelled && stepNum <= current) ? "bg-primary" : "bg-muted"
                )} />
                {/* circle */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                    isCancelledStep && "bg-destructive border-destructive text-destructive-foreground",
                    isUpcoming && "bg-background border-muted text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isCancelledStep ? (
                    <X className="h-4 w-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                {/* right line */}
                <div className={cn(
                  "h-0.5 flex-1",
                  idx === steps.length - 1 ? "opacity-0" : isCompleted ? "bg-primary" : "bg-muted"
                )} />
              </div>
              {!compact && (
                <span
                  className={cn(
                    "mt-2 text-[11px] leading-tight text-center px-0.5",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-semibold",
                    isCancelledStep && "text-destructive font-semibold",
                    isUpcoming && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="md:hidden flex flex-col gap-2">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = !cancelled && stepNum < current;
          const isCurrent = !cancelled && stepNum === current;
          const isCancelledStep = cancelled && stepNum === current;
          const isUpcoming = !isCompleted && !isCurrent && !isCancelledStep;

          return (
            <div key={stepNum} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary border-primary text-primary-foreground ring-2 ring-primary/30",
                  isCancelledStep && "bg-destructive border-destructive text-destructive-foreground",
                  isUpcoming && "bg-background border-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : isCancelledStep ? <X className="h-3 w-3" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isCompleted && "text-foreground",
                  isCurrent && "text-primary font-semibold",
                  isCancelledStep && "text-destructive font-semibold",
                  isUpcoming && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RentalTimeline;