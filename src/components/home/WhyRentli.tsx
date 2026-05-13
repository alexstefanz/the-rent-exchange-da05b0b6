import { Wallet, ShieldCheck, FileText, Headphones, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WhyRentli = () => {
  const { t } = useLanguage();
  const items = [
    { icon: Wallet, title: t("Folosești fără să cumperi", "Use without buying"), desc: t("Plătești doar perioada de care ai nevoie.", "Pay only for the period you need.") },
    { icon: ShieldCheck, title: t("Produse verificate", "Verified items"), desc: t("Anunțuri aprobate manual de echipa noastră.", "Listings manually reviewed by our team.") },
    { icon: FileText, title: t("Proces verbal digital", "Digital handover record"), desc: t("Foto check-in/out pentru fiecare închiriere.", "Photo check-in/out for every rental.") },
    { icon: CreditCard, title: t("Plăți securizate", "Secure payments"), desc: t("Hold & capture prin Stripe, fonduri protejate.", "Hold & capture via Stripe, funds protected.") },
    { icon: Headphones, title: t("Suport dedicat", "Dedicated support"), desc: t("Echipă reală 7 zile pe săptămână.", "Real team 7 days a week.") },
  ];
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t("De ce Rentli?", "Why Rentli?")}</h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {t("Marketplace-ul de închirieri construit pentru încredere.", "The rental marketplace built for trust.")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="group rounded-2xl bg-card p-4 border border-border/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 motion-safe:animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-semibold text-sm text-foreground leading-tight">{it.title}</div>
              <div className="mt-1 text-xs text-muted-foreground leading-snug">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRentli;