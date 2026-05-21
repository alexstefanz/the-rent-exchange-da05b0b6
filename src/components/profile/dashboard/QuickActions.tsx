import { Link } from "react-router-dom";
import { Plus, ShoppingBag, PackageCheck, MessageCircle, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SecondaryProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  highlight?: boolean;
}

const Secondary = ({ to, icon: Icon, label, badge, highlight }: SecondaryProps) => {
  const isOn = !!highlight && !!badge && badge > 0;
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 rounded-[12px] border p-4 transition-all",
        isOn
          ? "bg-[#F59E0B] hover:bg-[#F98715] border-transparent text-white shadow-md hover:shadow-lg"
          : "bg-card hover:border-primary/40 hover:shadow-sm",
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
            isOn ? "bg-white/20" : "bg-muted group-hover:bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 transition-colors",
              isOn ? "text-white" : "text-foreground group-hover:text-primary",
            )}
          />
        </div>
        {!!badge && badge > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1 shadow-sm",
              isOn ? "bg-white text-black" : "bg-destructive text-destructive-foreground",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span
        className={cn(
          "text-xs sm:text-sm text-center",
          isOn ? "text-white font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
    </Link>
  );
};

interface Props {
  unreadMessages: number;
  activeRentalsAsRenter: number;
  activeRentalsAsOwner: number;
  availableBalance?: number;
}

export function QuickActions({ unreadMessages, activeRentalsAsRenter, activeRentalsAsOwner, availableBalance = 0 }: Props) {
  const { t } = useLanguage();
  return (
    <section className="grid grid-cols-2 sm:grid-cols-6 gap-3">
      {/* Primary CTA — spans 2 on mobile */}
      <Link
        to="/owner/new-product"
        className="col-span-2 sm:col-span-1 group relative flex sm:flex-col items-center justify-center gap-3 sm:gap-2 rounded-[12px] p-4 bg-gradient-to-br from-[#F59E0B] to-[#F98715] text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
          <Plus className="h-6 w-6" />
        </div>
        <span className="text-sm sm:text-base font-semibold">{t("Adaugă produs", "Add product")}</span>
      </Link>

      <Secondary
        to="/rezervari"
        icon={ShoppingBag}
        label={t("Închirierile mele", "My rentals")}
        badge={activeRentalsAsRenter}
        highlight
      />
      <Secondary
        to="/anunturi?tab=cereri"
        icon={PackageCheck}
        label={t("Cereri primite", "Bookings received")}
        badge={activeRentalsAsOwner}
        highlight
      />
      <Secondary
        to="/mesaje"
        icon={MessageCircle}
        label={t("Mesaje", "Messages")}
        badge={unreadMessages}
      />
      <Secondary to="/castiguri" icon={Wallet} label={t("Câștiguri", "Earnings")} />
      <Link
        to="/castiguri"
        className="group relative flex flex-col items-center justify-center gap-2 rounded-[12px] border bg-card hover:border-primary/40 hover:shadow-sm p-4 transition-all"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {availableBalance.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">RON</span>
        </span>
        <span className="text-[11px] text-muted-foreground -mt-1">{t("Balanță", "Balance")}</span>
      </Link>
    </section>
  );
}