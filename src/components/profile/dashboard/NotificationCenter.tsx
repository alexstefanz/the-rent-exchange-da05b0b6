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

const EXACT: Record<string, [string, string]> = {
  product_rejected: ["Anunț respins", "Listing rejected"],
  product_approved: ["Anunț aprobat", "Listing approved"],
  product_published: ["Anunț publicat", "Listing published"],
  pv_return_completed_by_party: ["PV de returnare semnat parțial", "Return report partially signed"],
  pv_pickup_completed_by_party: ["PV de predare semnat parțial", "Handover report partially signed"],
  return_in_progress: ["Returnare în curs", "Return in progress"],
  return_reminder: ["Reamintire returnare", "Return reminder"],
  handover_confirmed: ["Predare confirmată", "Handover confirmed"],
  pickup_proposed: ["Propunere de oră și locație", "Pickup time proposed"],
  payment_succeeded: ["Plată reușită", "Payment successful"],
  request_accepted: ["Cerere acceptată", "Request accepted"],
  request_created: ["Cerere nouă de închiriere", "New rental request"],
  request_rejected: ["Cerere refuzată", "Request rejected"],
  review_received: ["Recenzie nouă", "New review"],
  new_message: ["Mesaje noi", "New messages"],
  support: ["Răspuns la tichet", "Ticket reply"],
  ticket_reminder: ["Reamintire tichet", "Ticket reminder"],
  refund: ["Rambursare", "Refund"],
};

const labelFor = (type: string, lang: "ro" | "en") => {
  const i = lang === "ro" ? 0 : 1;
  if (EXACT[type]) return EXACT[type][i];
  const map: Record<string, [string, string]> = {
    message: ["Mesaje", "Messages"],
    review: ["Recenzii", "Reviews"],
    payout: ["Plăți", "Payouts"],
    payment: ["Plăți", "Payments"],
    withdraw: ["Retrageri", "Withdrawals"],
    extension: ["Prelungiri", "Extensions"],
    dispute: ["Dispute", "Disputes"],
    cancel: ["Anulări", "Cancellations"],
    pv_: ["Procese verbale", "Handover reports"],
    rental: ["Rezervări", "Bookings"],
    booking: ["Rezervări", "Bookings"],
    reservation: ["Rezervări", "Bookings"],
    product: ["Anunțuri", "Listings"],
    ticket: ["Suport", "Support"],
  };
  for (const k of Object.keys(map)) {
    if (type.includes(k)) return map[k][i];
  }
  const pretty = type.replace(/_/g, " ").trim();
  return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : lang === "ro" ? "Sistem" : "System";
};

export function NotificationCenter({ data }: { data: AccountDashboardData }) {
  const { t, language } = useLanguage();
  const { unread } = data.notifications;
  const merged = new Map<string, { type: string; count: number }>();
  for (const g of data.notifications.grouped) {
    const label = labelFor(g.type, language);
    const cur = merged.get(label);
    if (cur) cur.count += g.count;
    else merged.set(label, { type: g.type, count: g.count });
  }
  const grouped = Array.from(merged.entries()).map(([label, v]) => ({ label, ...v }));

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