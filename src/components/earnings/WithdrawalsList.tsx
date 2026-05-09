import { useState } from "react";
import { ChevronDown, AlertCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import PayoutTimeline from "./PayoutTimeline";
import { StatusBadge, type EarningsStatus } from "./statusBadge";
import type { WithdrawalRow } from "@/hooks/useEarnings";

const mapStatus = (s: string): EarningsStatus => {
  if (s === "completed") return "paid";
  if (s === "approved") return "processing";
  if (s === "rejected") return "failed";
  return "withdraw_initiated";
};

const maskShort = (iban: string) => {
  const c = iban.replace(/\s/g, "");
  return c.length > 8 ? `${c.slice(0, 4)} •••• ${c.slice(-4)}` : c;
};

export const WithdrawalsList = ({
  withdrawals,
  onRetry,
}: {
  withdrawals: WithdrawalRow[];
  onRetry: () => void;
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);

  if (withdrawals.length === 0) return null;

  const fmt = (d: string) => new Date(d).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB");

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-5 sm:p-6 border-b flex items-center gap-2">
        <ArrowUpRight className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">{t("Cererile tale de retragere", "Your withdrawal requests")}</h3>
      </div>
      <div className="divide-y">
        {withdrawals.map((w) => {
          const isOpen = open === w.id;
          return (
            <div key={w.id}>
              <button
                onClick={() => setOpen(isOpen ? null : w.id)}
                className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-muted/30 transition text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{w.amount.toFixed(2)} RON</span>
                    <StatusBadge status={mapStatus(w.status)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    {maskShort(w.iban)} · {fmt(w.created_at)}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 space-y-4 animate-fade-in">
                  <PayoutTimeline status={w.status} />
                  {w.status === "rejected" && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <p className="font-medium text-destructive">
                          {t("Retragere respinsă", "Withdrawal rejected")}
                        </p>
                        {w.admin_note && <p className="text-muted-foreground mt-1">{w.admin_note}</p>}
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={onRetry}>
                            {t("Încearcă din nou", "Try again")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate("/contul-meu?section=payout")}>
                            {t("Schimbă IBAN", "Change IBAN")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WithdrawalsList;