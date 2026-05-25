import { Send, CheckCircle2, Package, Wrench, Undo2, Wallet } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";
import CycleTimeline from "@/components/howitworks/CycleTimeline";

const HowItWorksMini = () => {
  const copy = useUxCopy();
  const p = copy.howItWorksPage;

  const steps = [
    { icon: Send, title: p.cycleStep1Title, desc: p.cycleStep1Desc },
    { icon: CheckCircle2, title: p.cycleStep2Title, desc: p.cycleStep2Desc },
    { icon: Package, title: p.cycleStep3Title, desc: p.cycleStep3Desc },
    { icon: Wrench, title: p.cycleStep4Title, desc: p.cycleStep4Desc },
    { icon: Undo2, title: p.cycleStep5Title, desc: p.cycleStep5Desc },
    { icon: Wallet, title: p.cycleStep6Title, desc: p.cycleStep6Desc },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            {p.processBadge}
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">{p.processTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{p.processSubtitle}</p>
        </div>

        {/* Desktop horizontal timeline */}
        <div className="relative hidden lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0"
          />
          <div className="relative grid grid-cols-6 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-2">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {`PAS · ${String(idx + 1).padStart(2, "0")}`}
                </span>
                <h3 className="mt-2 font-heading text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet: 3 columns × 2 rows */}
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center px-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {`PAS · ${String(idx + 1).padStart(2, "0")}`}
              </span>
              <h3 className="mt-2 font-heading text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline (same as "Cum funcționează" page) */}
        <div className="md:hidden">
          <CycleTimeline steps={steps} />
        </div>
      </div>
    </section>
  );
};

export default HowItWorksMini;
