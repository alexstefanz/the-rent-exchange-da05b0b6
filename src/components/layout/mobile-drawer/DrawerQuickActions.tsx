import { Link } from "react-router-dom";
import { LucideIcon, PlusCircle, MessageCircle, CalendarCheck, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  unreadMessages: number;
  activeRentals: number;
  balance: number;
  onNavigate: () => void;
}

interface Action {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  hint?: string;
}

export function DrawerQuickActions({ unreadMessages, activeRentals, balance, onNavigate }: Props) {
  const { t } = useLanguage();

  const actions: Action[] = [
    { to: "/owner/new-product", icon: PlusCircle, label: t("Adaugă", "Add") },
    { to: "/mesaje", icon: MessageCircle, label: t("Mesaje", "Messages"), badge: unreadMessages },
    { to: "/rezervari", icon: CalendarCheck, label: t("Rezervări", "Bookings"), badge: activeRentals },
    { to: "/castiguri", icon: Wallet, label: t("Câștiguri", "Earnings"), hint: `${balance.toFixed(0)} RON` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.to}
            to={a.to}
            onClick={onNavigate}
            className="group relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-foreground leading-tight truncate">{a.label}</span>
              {a.hint && <span className="text-[10px] text-muted-foreground truncate">{a.hint}</span>}
            </span>
            {a.badge !== undefined && a.badge > 0 && (
              <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {a.badge > 99 ? "99+" : a.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}