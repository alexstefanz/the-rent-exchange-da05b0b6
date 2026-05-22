import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface StepDef {
  id: number;
  label: string;
  shortLabel: string;
}

interface Props {
  steps: StepDef[];
  current: number;
  maxReached: number;
  onJump: (step: number) => void;
}

const PublishStepper = ({ steps, current, maxReached, onJump }: Props) => {
  const { t } = useLanguage();
  const progressPct = ((current - 1) / (steps.length - 1)) * 100;

  return (
    <div className="border-b border-border bg-background">
      {/* Mobile progress bar */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">
            {t(`Pasul ${current} din ${steps.length}`, `Step ${current} of ${steps.length}`)}
          </span>
          <span className="text-foreground">{steps[current - 1]?.shortLabel}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Desktop stepper */}
      <div className="hidden md:block px-6 py-4">
        <ol className="mx-auto flex max-w-4xl items-center justify-between">
          {steps.map((step, idx) => {
            const status: "done" | "current" | "todo" =
              step.id < current ? "done" : step.id === current ? "current" : "todo";
            const reachable = step.id <= maxReached;
            return (
              <li key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && onJump(step.id)}
                  className={cn(
                    "flex items-center gap-3 text-left transition-opacity",
                    !reachable && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                      status === "done" && "border-primary bg-primary text-primary-foreground",
                      status === "current" && "border-primary bg-background text-primary",
                      status === "todo" && "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {status === "done" ? <Check className="h-4 w-4" /> : step.id}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-medium lg:inline",
                      status === "current" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-3 h-0.5 flex-1 transition-colors",
                      step.id < current ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default PublishStepper;