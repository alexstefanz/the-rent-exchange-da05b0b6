import { Link } from "react-router-dom";
import { ShieldAlert, Wallet, CalendarClock, LifeBuoy, ChevronRight, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  activeRentals: number;
  balance: number;
  openTickets: number;
  onNavigate: () => void;
}

interface StatusBanner {
  to: string;
  icon: LucideIcon;
  text: string;
  tone: "warning" | "success" | "info";
}

const toneClasses: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

export function DrawerContextualStatus({
  activeRentals,
  balance,
  openTickets,
  onNavigate,
}: Props) {
  const { t } = useLanguage();
  const banners: StatusBanner[] = [];

  if (activeRentals > 0) {
    banners.push({
      to: "/rezervari",
      icon: CalendarClock,
      text: t(
        `Ai ${activeRentals} ${activeRentals === 1 ? "rezervare activă" : "rezervări active"}`,
        `You have ${activeRentals} active ${activeRentals === 1 ? "rental" : "rentals"}`
      ),
      tone: "info",
    });
  }
  if (balance >= 50) {
    banners.push({
      to: "/castiguri",
      icon: Wallet,
      text: t(`Ai ${balance.toFixed(0)} RON disponibili`, `${balance.toFixed(0)} RON available`),
      tone: "success",
    });
  }
  if (openTickets > 0) {
    banners.push({
      to: "/suport",
      icon: LifeBuoy,
      text: t(
        `${openTickets} ${openTickets === 1 ? "tichet activ" : "tichete active"}`,
        `${openTickets} active ${openTickets === 1 ? "ticket" : "tickets"}`
      ),
      tone: "info",
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 px-2">
      {banners.slice(0, 2).map((b) => {
        const Icon = b.icon;
        return (
          <Link
            key={b.to + b.text}
            to={b.to}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-all active:scale-[.99] ${toneClasses[b.tone]}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{b.text}</span>
            <ChevronRight className="h-4 w-4 opacity-70" />
          </Link>
        );
      })}
    </div>
  );
}