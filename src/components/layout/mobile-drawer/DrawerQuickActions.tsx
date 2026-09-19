import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Wallet, Package, FileText, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  activeRentalsAsRenter: number;
  activeRentalsAsOwner: number;
  balance: number;
  onNavigate: () => void;
}

interface CardProps {
  to: string;
  icon: any;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  tone?: "default" | "success" | "warning";
  onNavigate: () => void;
}

function StatCard({ to, icon: Icon, label, value, highlight, tone = "default", onNavigate }: CardProps) {
  const toneClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "success"
        ? "text-emerald-600"
        : "text-primary";
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "relative flex flex-col rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
        highlight && "border-primary/40 shadow-sm",
      )}
    >
      <Icon className={cn("h-4 w-4", toneClass)} />
      <div className="mt-1.5 text-sm font-semibold text-foreground leading-tight">{value}</div>
      <div className="text-[12px] font-semibold text-foreground leading-tight">{label}</div>
    </Link>
  );
}

export function DrawerQuickActions({
  activeRentalsAsRenter,
  activeRentalsAsOwner,
  balance,
  onNavigate,
}: Props) {
  const { t } = useLanguage();
  const [showBalance, setShowBalance] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("show_balance") !== "false",
  );

  const toggleBalance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem("show_balance", String(next));
      return next;
    });
  };

  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      <StatCard
        to="/rezervari"
        icon={CalendarCheck}
        label={t("active (chiriaș)", "active (renter)")}
        value={activeRentalsAsRenter}
        highlight={activeRentalsAsRenter > 0}
        onNavigate={onNavigate}
      />
      <StatCard
        to="/castiguri"
        icon={Wallet}
        tone="success"
        label={t("balanță", "balance")}
        onNavigate={onNavigate}
        value={
          <span className="inline-flex items-center gap-1">
            {showBalance ? `${balance.toFixed(0)} RON` : "•••"}
            <span
              role="button"
              onClick={toggleBalance}
              className="inline-flex items-center justify-center"
              aria-label={showBalance ? t("Ascunde", "Hide") : t("Arată", "Show")}
            >
              {showBalance ? (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Eye className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          </span>
        }
      />
      <StatCard
        to="/inchirieri?status=ongoing"
        icon={Package}
        label={t("cereri (proprietar)", "requests (owner)")}
        value={activeRentalsAsOwner}
        highlight={activeRentalsAsOwner > 0}
        onNavigate={onNavigate}
      />
      <StatCard
        to="/anunturi"
        icon={FileText}
        label={t("anunțurile mele", "my listings")}
        value={t("Vezi", "View")}
        onNavigate={onNavigate}
      />
    </div>
  );
}