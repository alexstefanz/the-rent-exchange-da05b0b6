import { Shield, FileCheck, AlertCircle, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const RentalProtection = () => {
  const { t } = useLanguage();
  const items = [
    { icon: Shield, title: t("Plăți securizate", "Secure payments"), desc: t("Stripe 3D Secure. Suma e blocată, nu retrasă.", "Stripe 3D Secure. Funds held, not withdrawn."), tone: "text-emerald-600 bg-emerald-50" },
    { icon: FileCheck, title: t("Proces verbal digital", "Digital handover"), desc: t("Poze obligatorii la predare și returnare.", "Mandatory photos at pickup and return."), tone: "text-blue-600 bg-blue-50" },
    { icon: AlertCircle, title: t("Protecție dispute", "Dispute protection"), desc: t("Echipa Rentli mediază orice problemă.", "Rentli team mediates any issue."), tone: "text-amber-600 bg-amber-50" },
    { icon: Headphones, title: t("Suport dedicat", "Dedicated support"), desc: t("Răspuns sub 1 oră prin chat sau email.", "Reply under 1 hour via chat or email."), tone: "text-primary bg-primary/10" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-1">{t("Închirierea ta e protejată", "Your rental is protected")}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t("4 beneficii care îți dau liniște la fiecare rezervare.", "4 benefits that give you peace of mind on every booking.")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.title} className="flex gap-3 rounded-xl border border-border p-3.5 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className={`shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center ${it.tone}`}>
              <it.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-foreground">{it.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalProtection;
