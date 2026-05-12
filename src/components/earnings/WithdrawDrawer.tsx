import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CheckCircle2, Landmark, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { PayoutMethod } from "@/hooks/useEarnings";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  available: number;
  method: PayoutMethod | null;
  onSuccess: () => void;
}

const MIN_AMOUNT = 2;

const maskIban = (iban: string) => {
  const c = iban.replace(/\s/g, "");
  if (c.length < 8) return c;
  return `${c.slice(0, 4)} •••• •••• ${c.slice(-4)}`;
};

const WithdrawDrawer = ({ open, onOpenChange, available, method, onSuccess }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setAmount("");
      setConfirm(false);
    }
  }, [open]);

  const num = Number(amount) || 0;
  const valid1 = num >= MIN_AMOUNT && num <= available;

  const presets = [0.25, 0.5, 1].map((p) => Math.floor(available * p * 100) / 100).filter((v) => v > 0);

  const submit = async () => {
    if (!user || !method || !valid1 || !confirm) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawal_requests" as any).insert({
        user_id: user.id,
        amount: num,
        iban: method.iban,
        account_holder: method.accountHolder,
      });
      if (error) throw error;
      setStep(4);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error(t("Nu s-a putut trimite cererea", "Could not submit request"));
    } finally {
      setSubmitting(false);
    }
  };

  const Dots = () => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step ? "w-6 bg-primary" : n < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && step < 4 && (
                <button onClick={() => setStep((s) => (s - 1) as any)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <SheetTitle className="text-base">
                {step === 4 ? t("Finalizat", "Done") : t("Retrage bani", "Withdraw funds")}
              </SheetTitle>
            </div>
            <Dots />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: amount */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Disponibil", "Available")}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{available.toFixed(2)} RON</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("Sumă de retras", "Amount to withdraw")}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min={MIN_AMOUNT}
                      max={available}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-2xl h-14 pr-16 font-semibold tabular-nums"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      RON
                    </span>
                  </div>
                  {num > 0 && num < MIN_AMOUNT && (
                    <p className="text-xs text-destructive mt-1.5">
                      {t(`Suma minimă: ${MIN_AMOUNT} RON`, `Minimum: ${MIN_AMOUNT} RON`)}
                    </p>
                  )}
                  {num > available && (
                    <p className="text-xs text-destructive mt-1.5">
                      {t("Depășește balanța disponibilă", "Exceeds available balance")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setAmount(String(p))}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border bg-background hover:bg-muted transition"
                    >
                      {i === 2 ? t("Tot", "All") : `${[25, 50, 100][i]}%`} · {p.toFixed(2)} RON
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: method */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
                <p className="text-sm font-medium">{t("Alege metoda de retragere", "Choose withdrawal method")}</p>
                {method ? (
                  <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Landmark className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">IBAN</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">{maskIban(method.iban)}</p>
                      {method.accountHolder && (
                        <p className="text-[11px] text-muted-foreground">{method.accountHolder}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("Nu ai nicio metodă de retragere setată.", "No withdrawal method set.")}
                    </p>
                    <Button size="sm" onClick={() => navigate("/contul-meu?section=payout")}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {t("Adaugă IBAN", "Add IBAN")}
                    </Button>
                  </div>
                )}

                <button
                  onClick={() => navigate("/contul-meu?section=payout")}
                  className="text-xs text-primary hover:underline"
                >
                  {t("Schimbă metoda", "Change method")}
                </button>
              </motion.div>
            )}

            {/* STEP 3: confirm */}
            {step === 3 && method && (
              <motion.div key="s3" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-5">
                <p className="text-sm font-medium">{t("Confirmă retragerea", "Confirm withdrawal")}</p>

                <div className="rounded-xl border bg-muted/30 p-4 text-center">
                  <p className="text-xs uppercase text-muted-foreground tracking-wider mb-1">
                    {t("Vei primi", "You'll receive")}
                  </p>
                  <p className="text-3xl font-bold tabular-nums">{num.toFixed(2)} RON</p>
                </div>

                <div className="rounded-xl border divide-y text-sm">
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">{t("Către", "To")}</span>
                    <span className="font-mono">{maskIban(method.iban)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">{t("Comision", "Fee")}</span>
                    <span className="font-medium">0.00 RON</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">{t("Timp procesare", "Processing time")}</span>
                    <span className="font-medium">{t("1-3 zile lucrătoare", "1-3 business days")}</span>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={confirm} onCheckedChange={(c) => setConfirm(!!c)} className="mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "Confirm că datele bancare sunt corecte și autorizez transferul.",
                      "I confirm bank details are correct and authorize the transfer."
                    )}
                  </span>
                </label>
              </motion.div>
            )}

            {/* STEP 4: success */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg">{t("Retragere inițiată cu succes", "Withdrawal initiated")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(
                      `Vei primi ${num.toFixed(2)} RON în 1-3 zile lucrătoare.`,
                      `You'll receive ${num.toFixed(2)} RON within 1-3 business days.`
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t p-4 sm:p-6">
          {step === 1 && (
            <Button className="w-full h-11" onClick={() => setStep(2)} disabled={!valid1}>
              {t("Continuă", "Continue")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 2 && (
            <Button className="w-full h-11" onClick={() => setStep(3)} disabled={!method}>
              {t("Continuă", "Continue")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 3 && (
            <Button className="w-full h-11" onClick={submit} disabled={!confirm || submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("Confirmă retragerea", "Confirm withdrawal")}
            </Button>
          )}
          {step === 4 && (
            <Button className="w-full h-11" onClick={() => onOpenChange(false)}>
              {t("Închide", "Close")}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WithdrawDrawer;