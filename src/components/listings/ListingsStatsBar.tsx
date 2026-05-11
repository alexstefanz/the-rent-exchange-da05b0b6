import { Package, CheckCircle2, Clock, EyeOff, Inbox, Wallet, FileEdit, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import type { OwnerListingsStats } from "@/hooks/queries/useOwnerListingsStats";

interface StatItem {
  key: keyof OwnerListingsStats;
  ro: string;
  en: string;
  icon: any;
  tone: string;
  format?: (n: number) => string;
}

const items: StatItem[] = [
  { key: "total", ro: "Total",          en: "Total",        icon: Package,      tone: "bg-primary/10 text-primary" },
  { key: "active", ro: "Active",        en: "Active",       icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
  { key: "pending", ro: "În verificare",en: "In review",    icon: Clock,        tone: "bg-amber-100 text-amber-700" },
  { key: "drafts", ro: "Drafturi",      en: "Drafts",       icon: FileEdit,     tone: "bg-slate-100 text-slate-700" },
  { key: "hidden", ro: "Ascunse",       en: "Hidden",       icon: EyeOff,       tone: "bg-zinc-100 text-zinc-700" },
  { key: "rejected", ro: "Respinse",    en: "Rejected",     icon: XCircle,      tone: "bg-rose-100 text-rose-700" },
  { key: "new_requests", ro: "Cereri noi", en: "New requests", icon: Inbox,     tone: "bg-blue-100 text-blue-700" },
  { key: "earnings_total", ro: "Câștiguri", en: "Earnings", icon: Wallet,       tone: "bg-violet-100 text-violet-700",
    format: (n) => `${Math.round(n)} RON` },
];

const StatCard = ({ item, value }: { item: StatItem; value: number }) => {
  const Icon = item.icon;
  const { language } = useLanguage();
  const animated = useCountUp(value, 600);
  return (
    <div className="group min-w-[150px] snap-start rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl", item.tone)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">
        {item.format ? item.format(animated) : animated}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{language === "ro" ? item.ro : item.en}</div>
    </div>
  );
};

const ListingsStatsBar = ({ stats }: { stats: OwnerListingsStats }) => {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-4 sm:gap-4 sm:overflow-visible lg:grid-cols-8">
        {items.map((it) => (
          <StatCard key={it.key} item={it} value={Number(stats[it.key] || 0)} />
        ))}
      </div>
    </div>
  );
};

export default ListingsStatsBar;