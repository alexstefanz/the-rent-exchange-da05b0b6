import { Link } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  Star,
  Wallet,
  Package,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountDashboardData } from "@/hooks/useAccountDashboard";

const iconForType = (type: string) => {
  if (type.includes("message")) return MessageCircle;
  if (type.includes("review")) return Star;
  if (type.includes("payout") || type.includes("withdraw") || type.includes("balance")) return Wallet;
  if (type.includes("rental") || type.includes("booking") || type.includes("reservation")) return Package;
  if (type.includes("kyc") || type.includes("verif")) return ShieldCheck;
  if (type.includes("approved") || type.includes("confirm")) return CheckCircle2;
  return Bell;
};

const colorForType = (type: string) => {
  if (type.includes("message")) return "bg-blue-50 text-blue-600";
  if (type.includes("review")) return "bg-amber-50 text-amber-600";
  if (type.includes("payout") || type.includes("withdraw")) return "bg-emerald-50 text-emerald-600";
  if (type.includes("rental") || type.includes("booking")) return "bg-[#F59E0B]/10 text-[#F59E0B]";
  return "bg-muted text-foreground";
};

const formatRelative = (iso: string, lang: "ro" | "en") => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return lang === "ro" ? "acum" : "now";
  if (m < 60) return lang === "ro" ? `acum ${m}m` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return lang === "ro" ? `acum ${h}h` : `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return lang === "ro" ? `acum ${d}z` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
    day: "numeric",
    month: "short",
  });
};

export function ActivityFeed({ data }: { data: AccountDashboardData }) {
  const { t, language } = useLanguage();
  const items = data.activity;

  return (
    <section className="rounded-[12px] border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{t("Activitate recentă", "Recent activity")}</h2>
        <Link to="/notificari" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          {t("Vezi toate", "View all")}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t("Nicio activitate încă", "No activity yet")}
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => {
            const Icon = iconForType(it.type);
            const tone = colorForType(it.type);
            const Wrapper: any = it.link ? Link : "div";
            const wrapperProps = it.link ? { to: it.link } : {};
            return (
              <li key={it.id}>
                <Wrapper
                  {...wrapperProps}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{it.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelative(it.created_at, language)}
                    </p>
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}