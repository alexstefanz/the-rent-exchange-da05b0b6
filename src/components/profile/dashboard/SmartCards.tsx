import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PackageCheck,
  MessageCircle,
  Wallet,
  Star,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountDashboardData } from "@/hooks/useAccountDashboard";

interface Signal {
  id: string;
  icon: React.ElementType;
  tone: "primary" | "neutral" | "success" | "warning";
  title: string;
  description: string;
  cta: string;
  href: string;
  primary?: boolean;
}

const toneClass = (tone: Signal["tone"]) => {
  switch (tone) {
    case "primary":
      return "bg-[#F59E0B]/10 text-[#F59E0B]";
    case "success":
      return "bg-emerald-50 text-emerald-600";
    case "warning":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-muted text-foreground";
  }
};

export function SmartCards({ data }: { data: AccountDashboardData }) {
  const { t } = useLanguage();
  const s = data.signals;

  const signals: Signal[] = [];

  if (s.pendingReturns > 0) {
    signals.push({
      id: "returns",
      icon: PackageCheck,
      tone: "primary",
      primary: true,
      title: t(
        `${s.pendingReturns} închirieri active`,
        `${s.pendingReturns} active rentals`
      ),
      description: t("Confirmă returul produselor tale", "Confirm the return of your items"),
      cta: t("Vezi închirierile", "View lendings"),
      href: "/anunturi?tab=cereri",
    });
  }
  if (s.actionableHandover > 0) {
    signals.push({
      id: "handover",
      icon: PackageCheck,
      tone: "warning",
      title: t(
        `${s.actionableHandover} predări de făcut`,
        `${s.actionableHandover} handovers to do`
      ),
      description: t("Semnează procesul verbal de predare", "Sign the handover report"),
      cta: t("Deschide", "Open"),
      href: "/anunturi?tab=cereri",
    });
  }
  if (s.unreadMessages > 0) {
    signals.push({
      id: "messages",
      icon: MessageCircle,
      tone: "neutral",
      title: t(
        `${s.unreadMessages} mesaje necitite`,
        `${s.unreadMessages} unread messages`
      ),
      description: t("Răspunde rapid pentru un rating mai bun", "Reply quickly for a better rating"),
      cta: t("Vezi conversațiile", "View conversations"),
      href: "/mesaje",
    });
  }
  if (s.availableBalance > 0) {
    signals.push({
      id: "balance",
      icon: Wallet,
      tone: "success",
      title: `${s.availableBalance.toFixed(2)} RON ${t("disponibili", "available")}`,
      description: t("Retrage-i în contul tău bancar", "Withdraw to your bank account"),
      cta: t("Retrage bani", "Withdraw"),
      href: "/castiguri",
    });
  }
  if (s.newReviews > 0) {
    signals.push({
      id: "reviews",
      icon: Star,
      tone: "neutral",
      title: t(
        `${s.newReviews} recenzii noi`,
        `${s.newReviews} new reviews`
      ),
      description: t("Vezi feedback-ul primit", "See the feedback you received"),
      cta: t("Vezi recenzii", "View reviews"),
      href: "/recenzii",
    });
  }
  if (s.ibanMissing) {
    signals.push({
      id: "iban",
      icon: CreditCard,
      tone: "neutral",
      title: t("Adaugă IBAN-ul tău", "Add your IBAN"),
      description: t("Cardul salvat e doar pentru plăți. Pentru a primi banii din chirii, adaugă IBAN-ul.", "Your saved card is only for payments. To receive rental earnings, add your IBAN."),
      cta: t("Adaugă IBAN", "Add IBAN"),
      href: "/castiguri",
    });
  }

  if (signals.length === 0) {
    return (
      <section className="rounded-[12px] border bg-card p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <Sparkles className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-lg">{t("Totul e în ordine", "All caught up")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Nu ai acțiuni urgente. Profită să adaugi un produs nou!", "No urgent actions. Why not list a new product?")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Ce ai de făcut", "What needs your attention")}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {signals.map((sig, i) => {
          const Icon = sig.icon;
          return (
            <motion.div
              key={sig.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to={sig.href}
                className={`group flex items-start gap-3 rounded-[12px] border bg-card p-4 hover:shadow-md transition-all ${
                  sig.primary ? "border-[#F59E0B]/40 ring-1 ring-[#F59E0B]/20" : ""
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClass(sig.tone)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug">{sig.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sig.description}</p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                      sig.primary ? "text-[#F59E0B]" : "text-foreground"
                    } group-hover:translate-x-0.5 transition-transform`}
                  >
                    {sig.cta}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}