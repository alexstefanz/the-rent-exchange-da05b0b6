import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUxCopy } from "@/hooks/useUxCopy";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  steps?: string[];
}

const ProgressIndicator = ({
  currentStep,
  totalSteps = 4,
  steps,
}: ProgressIndicatorProps) => {
  const copy = useUxCopy();
  
  const defaultSteps = [
    copy.booking.steps.period,
    copy.booking.steps.message,
    copy.booking.steps.auth,
    copy.booking.steps.confirm,
  ];

  const activeSteps = steps || defaultSteps;

  return (
    <div className="w-full">
      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {copy.progressIndicator.stepOf(currentStep, totalSteps)}
          </span>
          <span className="text-sm text-muted-foreground">
            {activeSteps[currentStep - 1]}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:flex items-center justify-center">
        {activeSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = index === activeSteps.length - 1;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-4 h-0.5 w-16 transition-all",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
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

export default ProgressIndicator;
