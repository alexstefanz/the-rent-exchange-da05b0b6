import { AlertCircle, CreditCard, CalendarX, Camera, MessageSquare, PackageCheck, Wallet } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";

interface UsageRule {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}

interface UsageRulesProps {
  rules?: UsageRule[];
  depositAmount?: number;
}

const UsageRules = ({ rules, depositAmount }: UsageRulesProps) => {
  const copy = useUxCopy();

  const defaultRules: UsageRule[] = [
    { icon: CreditCard, title: copy.usageRules.payment, description: copy.usageRules.paymentDesc },
    { icon: CalendarX, title: copy.usageRules.cancellation, description: copy.usageRules.cancellationDesc },
    { icon: Camera, title: copy.usageRules.handover, description: copy.usageRules.handoverDesc },
    { icon: MessageSquare, title: copy.usageRules.communication, description: copy.usageRules.communicationDesc },
    { icon: PackageCheck, title: copy.usageRules.return, description: copy.usageRules.returnDesc },
  ];

  const displayRules = rules || defaultRules;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-primary" />
        {copy.product.rules}
      </h2>
      <div className="space-y-4">
        {displayRules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
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
                {copy.product.deposit}: {depositAmount} RON
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-700">
              {copy.usageRules.depositReturn}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageRules;
