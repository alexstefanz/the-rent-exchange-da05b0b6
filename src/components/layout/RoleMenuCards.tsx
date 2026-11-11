import { useState } from "react";
import { ChevronRight, Store, ShoppingBag, Tag, Mail, ArrowLeftRight, Send, Package, Heart, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleMenuCounts } from "@/hooks/queries/useRoleMenuCounts";
import { cn } from "@/lib/utils";

type Tone = "owner" | "renter";

interface Row { icon: LucideIcon; title: string; desc: string; to: string; count?: number; highlight?: boolean }

function RoleCard({ tone, icon: Icon, title, subtitle, rows, onNavigate }: {
  tone: Tone; icon: LucideIcon; title: string; subtitle: string; rows: Row[]; onNavigate: (to: string) => void;
}) {
  const accentText = tone === "owner" ? "text-primary" : "text-renter";
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="divide-y divide-border/50" title={subtitle} aria-label={title}>
        {rows.map((r) => {
          const RIcon = r.icon;
          const show = (r.count ?? 0) > 0;
          return (
            <button key={r.title} onClick={() => onNavigate(r.to)}
              className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/50">
              <RIcon className={cn("h-4 w-4 shrink-0", r.highlight && show ? accentText : "text-foreground/70")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{r.desc}</span>
              </span>
              {show && (
                <span className={cn(
                  "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                  r.highlight ? (tone === "owner" ? "bg-primary text-primary-foreground" : "bg-renter text-renter-foreground") : "bg-muted text-foreground",
                )}>{r.count}</span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:text-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RoleMenuCards({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: c } = useRoleMenuCounts(user?.id);
  const [tab, setTab] = useState<Tone>("owner");

  const ownerRows: Row[] = [
    { icon: Tag, title: t("Anunțurile mele", "My listings"), desc: t("Produsele pe care le-ai publicat", "Products you have published"), to: "/anunturi", count: c?.listings },
    { icon: Mail, title: t("Cereri primite", "Received requests"), desc: t("Alții vor să închirieze de la tine", "Others want to rent from you"), to: "/inchirieri?tab=requests", count: c?.ownerPending, highlight: true },
    { icon: ArrowLeftRight, title: t("Închirieri în desfășurare", "Ongoing rentals"), desc: t("Produsele tale aflate la chiriași", "Your products with renters"), to: "/inchirieri?tab=active", count: c?.ownerActive },
  ];
  const renterRows: Row[] = [
    { icon: Send, title: t("Cereri trimise", "Sent requests"), desc: t("Așteaptă răspunsul proprietarului", "Awaiting the owner's reply"), to: "/rezervari?tab=requests", count: c?.renterPending },
    { icon: Package, title: t("Închirierile mele", "My rentals"), desc: t("Produse închiriate de tine", "Products you are renting"), to: "/rezervari?tab=active", count: c?.renterActive },
    { icon: Heart, title: t("Favorite", "Favorites"), desc: t("Anunțuri salvate", "Saved listings"), to: "/favorite" },
  ];
  const ownerAlert = (c?.ownerPending ?? 0) > 0;
  const renterAlert = (c?.renterPending ?? 0) > 0;
  const tabs: { key: Tone; icon: LucideIcon; label: string; alert: boolean }[] = [
    { key: "owner", icon: Store, label: t("Proprietar", "Owner"), alert: ownerAlert },
    { key: "renter", icon: ShoppingBag, label: t("Chiriaș", "Renter"), alert: renterAlert },
  ];

  return (
    <div className="space-y-2">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tb) => {
          const TIcon = tb.icon;
          const active = tab === tb.key;
          return (
            <button key={tb.key} role="tab" aria-selected={active} type="button" onClick={() => setTab(tb.key)}
              className={cn("relative flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold transition",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <TIcon className={cn("h-4 w-4", active && (tb.key === "owner" ? "text-primary" : "text-renter"))} />
              {tb.label}
              {tb.alert && !active && <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      {tab === "owner"
        ? <RoleCard tone="owner" icon={Store} title={t("Proprietar", "Owner")} subtitle={t("Ce închiriezi tu altora", "What you rent out to others")} rows={ownerRows} onNavigate={onNavigate} />
        : <RoleCard tone="renter" icon={ShoppingBag} title={t("Chiriaș", "Renter")} subtitle={t("Ce închiriezi tu de la alții", "What you rent from others")} rows={renterRows} onNavigate={onNavigate} />}
    </div>
  );
}
