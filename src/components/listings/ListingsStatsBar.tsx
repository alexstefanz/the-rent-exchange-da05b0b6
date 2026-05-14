import { Package, CheckCircle2, Clock, Inbox } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import type { OwnerListingsStats } from "@/hooks/queries/useOwnerListingsStats";
import type { ListingsStatusFilter } from "./ListingsFilterBar";

interface StatItem {
  key: keyof OwnerListingsStats;
  ro: string;
  en: string;
  icon: any;
  tone: string;
  status?: ListingsStatusFilter;
  action?: "rentals";
}

const items: StatItem[] = [
  { key: "total", ro: "Total", en: "Total", icon: Package, tone: "bg-primary/10 text-primary", status: "all" },
  { key: "active", ro: "Active", en: "Active", icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700", status: "active" },
  { key: "pending", ro: "În verificare", en: "In review", icon: Clock, tone: "bg-amber-100 text-amber-700", status: "pending" },
  { key: "new_requests", ro: "Cereri noi", en: "New requests", icon: Inbox, tone: "bg-blue-100 text-blue-700", action: "rentals" },
];

interface StatCardProps {
  item: StatItem;
  value: number;
  active: boolean;
  onClick: () => void;
}

const StatCard = ({ item, value, active, onClick }: StatCardProps) => {
  const Icon = item.icon;
  const { language } = useLanguage();
  const animated = useCountUp(value, 600);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group text-left rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        active ? "border-primary ring-2 ring-primary/40" : "border-border/60",
      )}
    >
      <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl", item.tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">{animated}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{language === "ro" ? item.ro : item.en}</div>
    </button>
  );
};

interface Props {
  stats: OwnerListingsStats;
  activeStatus: ListingsStatusFilter;
  onSelectStatus: (s: ListingsStatusFilter) => void;
  onOpenRentals: () => void;
}

const ListingsStatsBar = ({ stats, activeStatus, onSelectStatus, onOpenRentals }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((it) => (
        <StatCard
          key={it.key}
          item={it}
          value={Number(stats[it.key] || 0)}
          active={!!it.status && it.status === activeStatus}
          onClick={() => (it.action === "rentals" ? onOpenRentals() : it.status && onSelectStatus(it.status))}
        />
      ))}
    </div>
  );
};

export default ListingsStatsBar;