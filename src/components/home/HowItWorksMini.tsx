import { Search, MessageSquare, PackageCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const HowItWorksMini = () => {
  const { t } = useLanguage();
  const steps = [
    { icon: Search, title: t("Caută produsul", "Find the item"), desc: t("Filtrează după categorie și locație și găsește exact ce ai nevoie.", "Filter by category and location to find exactly what you need.") },
    { icon: MessageSquare, title: t("Trimite cererea", "Send a request"), desc: t("Discută pe chat cu proprietarul și plătește în siguranță.", "Chat with the owner and pay securely in-app.") },
    { icon: PackageCheck, title: t("Ridică și folosește", "Pick up and use"), desc: t("Predare cu foto obligatorii, fără surprize la întoarcere.", "Mandatory photo handover — no surprises on return.") },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            {t("Procesul", "The process")}
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
            {t("Cum funcționează", "How it works")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t("Trei pași simpli — de la căutare la folosire.", "Three simple steps — from search to use.")}
          </p>
        </div>

        {/* Desktop zigzag timeline */}
        <div className="relative mx-auto hidden max-w-4xl md:block">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0"
          />
          <div className="space-y-14">
            {steps.map((step, idx) => {
              const left = idx % 2 === 0;
              return (
                <div key={idx} className="relative grid grid-cols-2 items-center gap-12">
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background"
                  />
                  <div className={cn(left ? "text-right pr-6" : "col-start-2 text-left pl-6")}>
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {`${t("PAS", "STEP")} · ${String(idx + 1).padStart(2, "0")}`}
                    </span>
                    <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                  <div className={cn(left ? "col-start-2 pl-6" : "row-start-1 pr-6")}>
                    <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-card", left ? "" : "ml-auto")}>
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
        <div className="relative md:hidden">
          <div aria-hidden className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-primary/30" />
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-14">
                <span
                  aria-hidden
                  className="absolute left-5 top-5 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
                />
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {`${t("PAS", "STEP")} · ${String(idx + 1).padStart(2, "0")}`}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksMini;
