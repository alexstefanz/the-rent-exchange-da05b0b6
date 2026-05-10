import { CheckCircle2, MessageCircle, FileSignature, PackageCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WhatHappensNext = () => {
  const { t } = useLanguage();
  const steps = [
    {
      icon: CheckCircle2,
      title: t("Proprietarul confirmă rezervarea", "Owner confirms the booking"),
      desc: t("Răspuns în maxim 24 ore", "Response within 24 hours"),
    },
    {
      icon: MessageCircle,
      title: t("Discutați detaliile în chat", "You discuss the details in chat"),
      desc: t("Coordonați ora și locul de ridicare", "Coordinate pickup time and place"),
    },
    {
      icon: FileSignature,
      title: t("Semnați procesul verbal digital", "Sign the digital handover report"),
      desc: t("Cu poze obligatorii pentru protecția ambelor părți", "With mandatory photos protecting both parties"),
    },
    {
      icon: PackageCheck,
      title: t("Ridici produsul", "You pick up the item"),
      desc: t("Te bucuri de închiriere — banii sunt eliberați după predare", "Enjoy the rental — funds are released after handover"),
    },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4">{t("Ce urmează?", "What happens next?")}</h3>
      <ol className="relative space-y-4">
        <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={i}
              className="relative flex gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-card">
                <Icon className="h-4 w-4" />
              </div>
              <div className="pt-0.5">
                <div className="text-sm font-medium text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default WhatHappensNext;