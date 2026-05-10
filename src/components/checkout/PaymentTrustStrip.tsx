import { Lock, Wallet, FileCheck2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PaymentTrustStrip = () => {
  const { t } = useLanguage();
  const items = [
    { icon: Lock, title: t("Plată securizată Stripe", "Secure Stripe payment"), desc: t("Criptare bancară end-to-end", "End-to-end bank encryption") },
    { icon: Wallet, title: t("Bani eliberați după predare", "Funds released after handover"), desc: t("Sumă ținută în escrow", "Amount held in escrow") },
    { icon: FileCheck2, title: t("Proces verbal digital", "Digital handover report"), desc: t("Inclus la fiecare închiriere", "Included with every rental") },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-600" />
                <div className="text-xs font-semibold text-foreground">{it.title}</div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 ml-6">{it.desc}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span>Visa</span>
        <span className="opacity-40">·</span>
        <span>Mastercard</span>
        <span className="opacity-40">·</span>
        <span>Apple Pay</span>
        <span className="opacity-40">·</span>
        <span>Google Pay</span>
      </div>
    </div>
  );
};

export default PaymentTrustStrip;