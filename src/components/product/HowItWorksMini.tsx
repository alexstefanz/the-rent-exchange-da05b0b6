import { Search, MessageCircle, Package, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorksMini = () => {
  const { t } = useLanguage();
  const steps = [
    { icon: Search, title: t("Trimite cerere", "Send request"), desc: t("Alege perioada și apasă Rezervă.", "Pick dates & hit Reserve.") },
    { icon: MessageCircle, title: t("Proprietarul confirmă", "Owner confirms"), desc: t("De obicei sub 1h.", "Usually under 1h.") },
    { icon: Package, title: t("Ridici produsul", "Pick up the item"), desc: t("Predare cu poze obligatorii.", "Handover with mandatory photos.") },
    { icon: RotateCcw, title: t("Returnezi & ești liber", "Return & you're done"), desc: t("Procesul se încheie cu PV-ul de returnare.", "The return PV closes the rental.") },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-5">{t("Cum funcționează", "How it works")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
        {steps.map((s, i) => (
          <div key={s.title} className="relative flex md:flex-col items-start md:items-center gap-3 md:text-center">
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center relative">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
            </div>
            <div className="md:mt-2">
              <div className="font-semibold text-sm text-foreground">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksMini;
