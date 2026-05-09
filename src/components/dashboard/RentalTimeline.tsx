import { Check, X, Send, ThumbsUp, Truck, ClipboardCheck, Package, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUxCopy } from "@/hooks/useUxCopy";

export interface RentalForTimeline {
  status: string;
  payment_status?: string | null;
  start_date?: string;
  end_date: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  refunded_at?: string | null;
  cancelled_at?: string | null;
}

function isLastDayOrPast(endDate?: string | null): boolean {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end.getTime() <= today.getTime();
}

function isStartReached(startDate?: string | null): boolean {
  if (!startDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return start.getTime() <= today.getTime();
}

/**
 * 7-step rental timeline:
 * 1. Cerere trimisă         (pending, not yet authorized)
 * 2. Cerere aprobată        (paid/confirmed before pickup window OR cancelled)
 * 3. În tranzit             (confirmed + start_date reached, no handover yet)
 * 4. Confirmare primire     (transient checkpoint — proces verbal predare)
 * 5. Produs în folosire     (handover_confirmed_at set, end_date not passed)
 * 6. În curs de returnare   (active + end_date passed, no return confirm yet)
 * 7. Finalizat              (status completed OR return_confirmed_at set)
 */
export function getTimelineStep(rental: RentalForTimeline): { current: number; cancelled: boolean } {
  if (rental.status === "cancelled") return { current: 2, cancelled: true };
  if (rental.status === "completed" || rental.return_confirmed_at) return { current: 7, cancelled: false };
  if (rental.handover_confirmed_at || rental.status === "active") {
    if (isLastDayOrPast(rental.end_date)) return { current: 6, cancelled: false };
    return { current: 5, cancelled: false };
  }
  if (rental.status === "confirmed") {
    if (isStartReached(rental.start_date)) return { current: 4, cancelled: false };
    return { current: 3, cancelled: false };
  }
  if (rental.payment_status === "authorized" || rental.payment_status === "paid") {
    return { current: 2, cancelled: false };
  }
  return { current: 1, cancelled: false };
}

// Per-step palette — full Tailwind class strings (safe for JIT).
// Order matches steps 1..7.
const STEP_STYLES = [
  // 1. Cerere trimisă — amber
  {
    bg: "bg-amber-400",
    border: "border-amber-400",
    ring: "ring-amber-400/30",
    text: "text-amber-600",
    line: "bg-amber-400",
    shadow: "shadow-[0_0_0_4px_rgba(251,191,36,0.18)]",
  },
  // 2. Cerere aprobată — orange (primary)
  {
    bg: "bg-orange-500",
    border: "border-orange-500",
    ring: "ring-orange-500/30",
    text: "text-orange-600",
    line: "bg-orange-500",
    shadow: "shadow-[0_0_0_4px_rgba(249,115,22,0.20)]",
  },
  // 3. În tranzit — deep orange (hover)
  {
    bg: "bg-[#F98715]",
    border: "border-[#F98715]",
    ring: "ring-[#F98715]/30",
    text: "text-[#F98715]",
    line: "bg-[#F98715]",
    shadow: "shadow-[0_0_0_4px_rgba(249,135,21,0.20)]",
  },
  // 4. Confirmare primire (proces verbal) — sky
  {
    bg: "bg-sky-500",
    border: "border-sky-500",
    ring: "ring-sky-500/30",
    text: "text-sky-600",
    line: "bg-sky-500",
    shadow: "shadow-[0_0_0_4px_rgba(14,165,233,0.20)]",
  },
  // 5. În folosire — rose
  {
    bg: "bg-rose-500",
    border: "border-rose-500",
    ring: "ring-rose-500/30",
    text: "text-rose-600",
    line: "bg-rose-500",
    shadow: "shadow-[0_0_0_4px_rgba(244,63,94,0.18)]",
  },
  // 6. În curs de returnare — violet
  {
    bg: "bg-violet-500",
    border: "border-violet-500",
    ring: "ring-violet-500/30",
    text: "text-violet-600",
    line: "bg-violet-500",
    shadow: "shadow-[0_0_0_4px_rgba(139,92,246,0.20)]",
  },
  // 7. Finalizat — emerald
  {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-600",
    line: "bg-emerald-500",
    shadow: "shadow-[0_0_0_4px_rgba(16,185,129,0.22)]",
  },
];

const STEP_ICONS = [Send, ThumbsUp, Truck, ClipboardCheck, Package, RotateCcw, CheckCircle2];

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
    copy.timeline.confirmReceipt,
    copy.timeline.inUse,
    copy.timeline.returning,
    copy.timeline.completed,
  ];

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

          const palette = STEP_STYLES[idx] ?? STEP_STYLES[STEP_STYLES.length - 1];
          const Icon = STEP_ICONS[idx] ?? Check;

          // Left line is "filled" when this step is reached or passed (i.e. previous step done).
          const leftFilled = !cancelled && stepNum <= current;
          // Right line is "filled" when this step is fully completed.
          const rightFilled = !cancelled
            ? stepNum < current
            : stepNum < current; // cancelled case: also reveal up to current

          // Color of each connector line uses the palette of the step it leads INTO.
          const leftPalette = STEP_STYLES[idx - 1] ?? palette;

          return (
            <div key={stepNum} className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-center w-full">
                {/* left connector */}
                <div
                  className={cn(
                    "relative h-1 flex-1 rounded-full overflow-hidden bg-muted",
                    idx === 0 && "opacity-0",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
                      leftFilled ? "w-full" : "w-0",
                      cancelled && stepNum === 2 ? "bg-destructive" : palette.line,
                    )}
                  />
                </div>

                {/* circle */}
                <div
                  className={cn(
                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-500 ease-in-out motion-reduce:transition-none",
                    isCompleted && cn(palette.bg, palette.border, "text-white scale-100"),
                    isCurrent && cn(palette.bg, palette.border, "text-white scale-110 ring-4", palette.ring, palette.shadow),
                    isCancelledStep && "bg-destructive border-destructive text-destructive-foreground scale-110 ring-4 ring-destructive/30",
                    isUpcoming && "bg-background border-muted text-muted-foreground scale-100",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 animate-scale-in" />
                  ) : isCancelledStep ? (
                    <X className="h-4 w-4 animate-scale-in" />
                  ) : isCurrent ? (
                    <Icon className="h-4 w-4 animate-scale-in" />
                  ) : (
                    <span>{stepNum}</span>
                  )}

                  {/* current pulse halo */}
                  {isCurrent && (
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full opacity-60 animate-ping motion-reduce:hidden",
                        palette.bg,
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* right connector */}
                <div
                  className={cn(
                    "relative h-1 flex-1 rounded-full overflow-hidden bg-muted",
                    idx === steps.length - 1 && "opacity-0",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
                      rightFilled ? "w-full" : "w-0",
                      // line color = next step palette to "introduce" the upcoming color
                      (STEP_STYLES[idx + 1] ?? palette).line,
                    )}
                  />
                </div>
              </div>

              {!compact && (
                <span
                  className={cn(
                    "mt-2 text-[11px] leading-tight text-center px-0.5 transition-colors duration-500 ease-in-out",
                    isCompleted && "text-foreground",
                    isCurrent && cn(palette.text, "font-semibold animate-fade-in"),
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
      <div className="md:hidden flex flex-col">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = !cancelled && stepNum < current;
          const isCurrent = !cancelled && stepNum === current;
          const isCancelledStep = cancelled && stepNum === current;
          const isUpcoming = !isCompleted && !isCurrent && !isCancelledStep;
          const isLast = idx === steps.length - 1;

          const palette = STEP_STYLES[idx] ?? STEP_STYLES[STEP_STYLES.length - 1];
          const Icon = STEP_ICONS[idx] ?? Check;
          const lineFilled = !cancelled && stepNum < current;
          const nextPalette = STEP_STYLES[idx + 1] ?? palette;

          return (
            <div key={stepNum} className="flex gap-3">
              {/* circle column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-all duration-500 ease-in-out motion-reduce:transition-none",
                    isCompleted && cn(palette.bg, palette.border, "text-white"),
                    isCurrent && cn(palette.bg, palette.border, "text-white ring-2", palette.ring),
                    isCancelledStep && "bg-destructive border-destructive text-destructive-foreground ring-2 ring-destructive/30",
                    isUpcoming && "bg-background border-muted text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isCancelledStep ? (
                    <X className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Icon className="h-3.5 w-3.5" />
                  ) : (
                    stepNum
                  )}
                  {isCurrent && (
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full opacity-60 animate-ping motion-reduce:hidden",
                        palette.bg,
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {/* vertical connector */}
                {!isLast && (
                  <div className="relative w-1 flex-1 min-h-[24px] my-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 rounded-full transition-[height] duration-700 ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
                        lineFilled ? "h-full" : "h-0",
                        nextPalette.line,
                      )}
                    />
                  </div>
                )}
              </div>

              {/* label */}
              <span
                className={cn(
                  "text-xs pt-1 pb-3 transition-colors duration-500 ease-in-out",
                  isCompleted && "text-foreground",
                  isCurrent && cn(palette.text, "font-semibold"),
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
