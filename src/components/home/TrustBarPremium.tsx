import { useEffect, useState } from "react";
import { ShieldCheck, Star, CreditCard, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepageActivity } from "@/hooks/useHomepageActivity";

function useCountUp(target: number, durationMs = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

const TrustBarPremium = () => {
  const { t } = useLanguage();
  const { data } = useHomepageActivity();
  const verified = useCountUp(Math.max(data?.totals.verified_users || 0, 0));
  const reviews = useCountUp(Math.max(data?.totals.total_reviews || 0, 0));
  const rating = data?.totals.avg_rating ? Number(data.totals.avg_rating).toFixed(1) : "5.0";

  const items = [
    {
      icon: ShieldCheck,
      value: t("Bunuri asigurate", "Insured items"),
      label: t("Protecție & PV inclus", "Protection & handover report included"),
      tone: "text-emerald-600",
    },
    {
      icon: Star,
      value: `${rating}★`,
      label: t(`rating mediu (${reviews} review-uri)`, `avg rating (${reviews} reviews)`),
      tone: "text-amber-500",
    },
    {
      icon: CreditCard,
      value: t("Plăți securizate", "Secure payments"),
      label: t("prin Stripe (3D Secure)", "via Stripe (3D Secure)"),
      tone: "text-primary",
    },
    {
      icon: Headphones,
      value: t("Suport Dedicat", "Dedicated Support"),
      label: t("Echipă reală", "Real team"),
      tone: "text-blue-500",
    },
  ];

  return (
    <section className="relative -mt-8 z-30">
      <div className="container">
        <div className="rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)] p-3 md:p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {items.map((it, i) => (
              <div
                key={i}
                className="group flex items-center gap-2.5 md:gap-3 rounded-xl px-2.5 py-2 md:px-3 md:py-2.5 hover:bg-primary/5 transition-colors"
              >
                <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform">
                  <it.icon className={`h-4.5 w-4.5 md:h-5 md:w-5 ${it.tone}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-[13px] md:text-base font-bold text-foreground leading-tight break-words">
                    {it.value}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground leading-snug break-words">
                    {it.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBarPremium;