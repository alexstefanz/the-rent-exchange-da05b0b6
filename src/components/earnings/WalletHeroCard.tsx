import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, TrendingUp, Lock, ShoppingBag, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsBanned } from "@/hooks/useIsBanned";

interface Props {
  available: number;
  thisMonth: number;
  pendingEarnings?: number;
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

export const WalletHeroCard = ({ available, thisMonth, pendingEarnings = 0, hasMethod, onWithdraw }: Props) => {
  const { t } = useLanguage();
  const { isBanned } = useIsBanned();
  const animatedAvailable = useCountUp(available);
  const animatedPending = useCountUp(pendingEarnings);
  const disabled = available <= 0 || !hasMethod || isBanned;

  const tooltipText = isBanned
    ? t("Cont suspendat — retragerile sunt blocate. Contactează suportul.", "Account suspended — withdrawals are blocked. Contact support.")
    : !hasMethod
    ? t("Adaugă o metodă de retragere mai întâi", "Add a withdrawal method first")
    : available <= 0
    ? t("Nu ai fonduri disponibile", "No funds available")
    : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Available card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background p-6 sm:p-7 shadow-sm flex flex-col"
      >
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
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

        <div className="relative mt-4 flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
            {animatedAvailable.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">RON</span>
        </div>

        {thisMonth > 0 && (
          <div className="relative mt-2 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-600 font-medium tabular-nums">
              +{thisMonth.toFixed(2)} RON
            </span>
            <span className="text-muted-foreground">{t("luna aceasta", "this month")}</span>
          </div>
        )}

        {available > 0 && (
          <div className="relative mt-3 flex items-start gap-1.5 text-xs text-muted-foreground max-w-md">
            <ShoppingBag className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <span>
              {t(
                "Poți folosi soldul pentru a plăti închirieri pe site. La pasul de plată va apărea opțiunea „Plătește din wallet”.",
                "You can use this balance to pay for rentals on the site. A “Pay from wallet” option appears at checkout."
              )}
            </span>
          </div>
        )}

        <div className="relative mt-auto pt-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={onWithdraw}
                    disabled={disabled}
                    className="h-12 px-6 w-full sm:w-auto shadow-md shadow-primary/20"
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

      {/* Pending card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-background to-background p-6 sm:p-7 shadow-sm flex flex-col"
      >
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("Bani în așteptare", "Pending balance")}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {t("Se deblochează la finalizare", "Unlocks on completion")}
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-amber-700">
            {animatedPending.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">RON</span>
        </div>

        <div className="relative mt-3 flex items-start gap-1.5 text-xs text-muted-foreground max-w-md">
          <Clock className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
          <span>
            {pendingEarnings > 0
              ? t(
                  "Fonduri câștigate după semnarea procesului verbal. Devin disponibile pentru retragere imediat ce închirierea este finalizată.",
                  "Funds earned after the handover protocol is signed. They become withdrawable once the rental is completed."
                )
              : t(
                  "Nu ai bani în așteptare. După semnarea procesului verbal, câștigurile vor apărea aici.",
                  "No pending balance. Earnings will appear here after the handover protocol is signed."
                )}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletHeroCard;