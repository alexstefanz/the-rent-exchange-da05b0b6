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
}

export function QuickActions({ unreadMessages, activeRentalsAsRenter, activeRentalsAsOwner }: Props) {
  const { t } = useLanguage();
  return (
    <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        to="/inchirieri"
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
    </section>
  );
}