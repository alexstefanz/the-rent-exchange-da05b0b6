import { Search, MessageSquare, PackageCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorksMini = () => {
  const { t } = useLanguage();
  const steps = [
    { icon: Search, title: t("1. Caută produsul", "1. Find the item"), desc: t("Filtrează după categorie și locație.", "Filter by category and location.") },
    { icon: MessageSquare, title: t("2. Trimite cererea", "2. Send a request"), desc: t("Discută pe chat și plătește în siguranță.", "Chat and pay securely in-app.") },
    { icon: PackageCheck, title: t("3. Ridică și folosește", "3. Pick up and use"), desc: t("Predare cu foto, fără surprize.", "Photo handover, no surprises.") },
  ];
  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t("Cum funcționează", "How it works")}</h2>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#F98715] text-primary-foreground shadow-lg mb-3">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="font-heading font-semibold text-base text-foreground">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground max-w-xs">{s.desc}</div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 -right-2 h-px w-4 bg-gradient-to-r from-primary/40 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksMini;