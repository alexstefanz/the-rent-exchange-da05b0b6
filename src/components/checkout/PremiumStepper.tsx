import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface PremiumStepperProps {
  currentStep: number;
  steps: string[];
}

const PremiumStepper = ({ currentStep, steps }: PremiumStepperProps) => {
  const { t } = useLanguage();
  const total = steps.length;
  return (
    <div className="w-full">
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            {t(`Pasul ${currentStep} din ${total}`, `Step ${currentStep} of ${total}`)}
          </span>
          <span className="text-sm text-primary font-medium">{steps[currentStep - 1]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--primary))] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center gap-3">
        {steps.map((step, i) => {
          const num = i + 1;
          const completed = num < currentStep;
          const current = num === currentStep;
          const isLast = i === steps.length - 1;
          return (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  {current && (
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  )}
                  <div
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                      completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : current
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {completed ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">{num}</span>}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    current ? "text-foreground" : completed ? "text-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div className="h-px w-12 bg-border relative overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-0 bg-primary transition-transform duration-500 origin-left",
                      completed ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PremiumStepper;