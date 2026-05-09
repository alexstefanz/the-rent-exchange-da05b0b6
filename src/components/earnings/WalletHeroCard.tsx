import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  available: number;
  thisMonth: number;
  hasMethod: boolean;
  onWithdraw: () => void;
}

const useCountUp = (target: number, ms = 800) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
};

export const WalletHeroCard = ({ available, thisMonth, hasMethod, onWithdraw }: Props) => {
  const { t } = useLanguage();
  const animated = useCountUp(available);
  const disabled = available <= 0 || !hasMethod;

  const tooltipText = !hasMethod
    ? t("Adaugă o metodă de retragere mai întâi", "Add a withdrawal method first")
    : available <= 0
    ? t("Nu ai fonduri disponibile", "No funds available")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background p-6 sm:p-8 shadow-sm"
    >
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("Disponibil pentru retragere", "Available to withdraw")}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {t("Date bancare criptate", "Encrypted bank data")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              {animated.toFixed(2)}
            </span>
            <span className="text-lg font-semibold text-muted-foreground">RON</span>
          </div>

          {thisMonth > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium tabular-nums">
                +{thisMonth.toFixed(2)} RON
              </span>
              <span className="text-muted-foreground">{t("luna aceasta", "this month")}</span>
            </div>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  size="lg"
                  onClick={onWithdraw}
                  disabled={disabled}
                  className="h-12 px-6 shadow-md shadow-primary/20"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  {t("Retrage bani", "Withdraw funds")}
                </Button>
              </span>
            </TooltipTrigger>
            {disabled && tooltipText && <TooltipContent>{tooltipText}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
};

export default WalletHeroCard;