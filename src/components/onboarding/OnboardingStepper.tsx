import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  current: 1 | 2 | 3 | 4;
  className?: string;
}

const STEPS = ["Cont", "Verificare", "Firmă", "Gata"];

export const OnboardingStepper = ({ current, className }: Props) => {
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="flex items-center justify-between">
        {STEPS.map((label, idx) => {
          const step = (idx + 1) as 1 | 2 | 3 | 4;
          const done = step < current;
          const active = step === current;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mb-5 rounded-full transition-colors",
                    done ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingStepper;