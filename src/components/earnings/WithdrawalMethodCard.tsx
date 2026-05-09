import { Landmark, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PayoutMethod } from "@/hooks/useEarnings";

const maskIban = (iban: string) => {
  const clean = iban.replace(/\s/g, "");
  if (clean.length < 8) return clean;
  const first = clean.slice(0, 4);
  const last = clean.slice(-4);
  const mid = "•••• •••• ••••";
  return `${first} ${mid} ${last}`;
};

export const WithdrawalMethodCard = ({ method }: { method: PayoutMethod | null }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const goToAccount = () => navigate("/contul-meu?section=payout");

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">{t("Metoda de retragere", "Withdrawal method")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Banii vor fi trimiși aici", "Funds will be sent here")}
          </p>
        </div>
      </div>

      {method ? (
        <div className="flex items-start sm:items-center gap-4 rounded-xl border bg-muted/30 p-4 flex-col sm:flex-row">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">IBAN</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {t("Implicit", "Default")}
              </Badge>
            </div>
            <p className="font-mono text-sm tracking-wide truncate">{maskIban(method.iban)}</p>
            {method.accountHolder && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{method.accountHolder}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={goToAccount} className="w-full sm:w-auto">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {t("Editează", "Edit")}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium text-sm mb-1">
            {t("Adaugă o metodă de retragere", "Add a withdrawal method")}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            {t(
              "Pentru a primi banii din închirieri trebuie să adaugi un IBAN.",
              "To receive funds from rentals you must add an IBAN."
            )}
          </p>
          <Button size="sm" onClick={goToAccount}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("Adaugă IBAN", "Add IBAN")}
          </Button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>{t("Datele tale bancare sunt criptate și protejate.", "Your bank details are encrypted and protected.")}</span>
      </div>
    </div>
  );
};

export default WithdrawalMethodCard;