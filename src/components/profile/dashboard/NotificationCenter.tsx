import { Link } from "react-router-dom";
import { Bell, MessageCircle, Star, Wallet, Package, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountDashboardData } from "@/hooks/useAccountDashboard";

const iconForType = (type: string) => {
  if (type.includes("message")) return MessageCircle;
  if (type.includes("review")) return Star;
  if (type.includes("payout") || type.includes("withdraw")) return Wallet;
  if (type.includes("rental") || type.includes("booking")) return Package;
  return Bell;
};

const labelFor = (type: string, lang: "ro" | "en") => {
  const map: Record<string, [string, string]> = {
    message: ["Mesaje", "Messages"],
    review: ["Recenzii", "Reviews"],
    payout: ["Plăți", "Payouts"],
    withdrawal: ["Retrageri", "Withdrawals"],
    rental: ["Rezervări", "Bookings"],
    booking: ["Rezervări", "Bookings"],
    system: ["Sistem", "System"],
  };
  for (const k of Object.keys(map)) {
    if (type.includes(k)) return lang === "ro" ? map[k][0] : map[k][1];
  }
  return type;
};

export function NotificationCenter({ data }: { data: AccountDashboardData }) {
  const { t, language } = useLanguage();
  const { unread, grouped } = data.notifications;

  return (
    <section className="rounded-[12px] border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("Notificări", "Notifications")}</h2>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
        <Link to="/notificari" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          {t("Centru notificări", "Center")}
        </Link>
      </div>
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t("Nu ai notificări noi", "No new notifications")}
        </p>
      ) : (
        <ul className="space-y-1">
          {grouped.map((g) => {
            const Icon = iconForType(g.type);
            return (
              <li key={g.type}>
                <Link
                  to="/notificari"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-muted">
                      <Icon className="h-4 w-4 text-foreground" />
                    </span>
                    <span className="font-medium">{labelFor(g.type, language)}</span>
                  </span>
                  <span className="text-xs font-bold text-foreground">{g.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}