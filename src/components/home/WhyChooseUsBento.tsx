import { ShieldCheck, UserCheck, Tag, Headphones, Check, AudioLines } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";

const WhyChooseUsBento = () => {
  const copy = useUxCopy();
  const p = copy.howItWorksPage;

  type BadgeKind = "verified" | "protected" | "audio" | "fee";

  const bentoCards: Array<{
    icon: typeof UserCheck;
    title: string;
    desc: string;
    chips: string[];
    badge: BadgeKind;
  }> = [
    {
      icon: UserCheck,
      title: p.bentoVerifiedTitle,
      desc: p.bentoVerifiedDesc,
      chips: [p.bentoVerifiedChip1, p.bentoVerifiedChip2, p.bentoVerifiedChip3],
      badge: "verified",
    },
    {
      icon: ShieldCheck,
      title: p.bentoInsuranceTitle,
      desc: p.bentoInsuranceDesc,
      chips: [p.bentoInsuranceChip1, p.bentoInsuranceChip2, p.bentoInsuranceChip3],
      badge: "protected",
    },
    {
      icon: Headphones,
      title: p.bentoSupportTitle,
      desc: p.bentoSupportDesc,
      chips: [p.bentoSupportChip1, p.bentoSupportChip2, p.bentoSupportChip3],
      badge: "audio",
    },
    {
      icon: Tag,
      title: p.bentoFeeTitle,
      desc: p.bentoFeeDesc,
      chips: [p.bentoFeeChip1, p.bentoFeeChip2, p.bentoFeeChip3],
      badge: "fee",
    },
  ];

  const renderBadge = (kind: BadgeKind) => {
    switch (kind) {
      case "verified":
        return (
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {p.bentoVerifiedStat}
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-primary/60" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
        );
      case "protected":
        return (
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            {p.bentoInsuranceStat}
          </span>
        );
      case "audio":
        return <AudioLines className="h-5 w-5 text-primary" />;
      case "fee":
        return (
          <div className="flex flex-col items-end leading-none">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-heading text-2xl font-bold text-primary">{p.bentoFeeStat}</span>
            </div>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {p.bentoFeeStatLabel}
            </span>
          </div>
        );
    }
  };

  return (
    <section className="border-t border-border bg-secondary/30 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            {p.whyBadge}
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-5xl">{p.whyTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{p.whySubtitle}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Big escrow card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1410] via-[#221913] to-[#2a1f17] p-8 lg:row-span-2 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(245,158,11,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.6) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {p.escrowPill}
              </span>
              <h3 className="mt-6 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">
                {p.escrowBigTitle} <span className="text-primary">{p.escrowBigTitleAccent}</span>
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{p.escrowBigDesc}</p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-white/50">{p.escrowAmountLabel}</div>
                      <div className="font-heading text-lg font-bold text-white">{p.escrowAmount}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {p.escrowSecuredBadge}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-[#F98715]" />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/50">
                    <span>{p.escrowStage1}</span>
                    <span>{p.escrowStage2}</span>
                    <span>{p.escrowStage3}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4 small cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
            {bentoCards.map((c, i) => (
              <div key={i} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  {renderBadge(c.badge)}
                </div>
                <h3 className="mt-8 font-heading text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {c.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-primary" />
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsBento;