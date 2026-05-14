import { motion } from "framer-motion";
import { CheckCircle2, ArrowUpRight, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  available: number;
  withdrawn: number;
  total: number;
}

export const BalanceBreakdown = ({ available, withdrawn, total }: Props) => {
  const { t } = useLanguage();

  const items = [
    {
      label: t("Disponibil", "Available"),
      value: available,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      hint: t("Pot fi retrași acum", "Can be withdrawn now"),
    },
    {
      label: t("Retras", "Withdrawn"),
      value: withdrawn,
      icon: ArrowUpRight,
      color: "text-slate-600",
      bg: "bg-slate-500/10",
      hint: t("Trimis către bancă", "Sent to bank"),
    },
    {
      label: t("Total câștiguri", "Total earnings"),
      value: total,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      hint: t("Toate închirierile finalizate", "All rentals to date"),
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-xl border bg-card p-4 hover:ring-1 hover:ring-primary/20 transition cursor-default">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-7 w-7 rounded-lg ${it.bg} flex items-center justify-center`}>
                      <it.icon className={`h-3.5 w-3.5 ${it.color}`} />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {it.label}
                    </span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {it.value.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">RON</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{it.hint}</TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default BalanceBreakdown;