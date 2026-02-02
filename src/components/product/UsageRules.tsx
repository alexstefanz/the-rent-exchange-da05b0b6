import { AlertCircle, Clock, Wallet, ShieldCheck } from "lucide-react";
import { uxCopy } from "@/data/uxCopy";

interface UsageRule {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}

interface UsageRulesProps {
  rules?: UsageRule[];
  depositAmount?: number;
}

const defaultRules: UsageRule[] = [
  {
    icon: Clock,
    title: "Politică de anulare",
    description: "Anulare gratuită cu până la 24 de ore înainte de începerea închirierii.",
  },
  {
    icon: Wallet,
    title: "Plată",
    description: "Plata se face în avans pentru a confirma rezervarea. Acceptăm card și transfer bancar.",
  },
  {
    icon: ShieldCheck,
    title: "Returnare",
    description: "Produsul trebuie returnat în aceeași stare în care a fost primit.",
  },
];

const UsageRules = ({ rules = defaultRules, depositAmount }: UsageRulesProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-primary" />
        {uxCopy.product.rules}
      </h2>
      <div className="space-y-4">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm">{rule.title}</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">{rule.description}</p>
              </div>
            </div>
          );
        })}

        {depositAmount && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {uxCopy.product.deposit}: {depositAmount} RON
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-700">
              Garanția se returnează integral la predarea produsului în stare bună.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageRules;
