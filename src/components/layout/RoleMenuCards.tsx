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
  const accentBg = tone === "owner" ? "bg-primary/10" : "bg-renter/10";
  const accentText = tone === "owner" ? "text-primary" : "text-renter";
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center gap-3 px-3 py-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accentBg)}>
          <Icon className={cn("h-5 w-5", accentText)} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-foreground">{title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
        </span>
      </div>
      <div className="divide-y divide-border/50 border-t border-border/50">
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

  return (
    <div className="space-y-2">
      <RoleCard tone="owner" icon={Store} title={t("Proprietar", "Owner")} subtitle={t("Ce închiriezi tu altora", "What you rent out to others")} onNavigate={onNavigate}
        rows={[
          { icon: Tag, title: t("Anunțurile mele", "My listings"), desc: t("Produsele pe care le-ai publicat", "Products you have published"), to: "/anunturi", count: c?.listings },
          { icon: Mail, title: t("Cereri primite", "Received requests"), desc: t("Alții vor să închirieze de la tine", "Others want to rent from you"), to: "/inchirieri?tab=requests", count: c?.ownerPending, highlight: true },
          { icon: ArrowLeftRight, title: t("Închirieri în desfășurare", "Ongoing rentals"), desc: t("Produsele tale aflate la chiriași", "Your products with renters"), to: "/inchirieri?tab=active", count: c?.ownerActive },
        ]} />
      <RoleCard tone="renter" icon={ShoppingBag} title={t("Chiriaș", "Renter")} subtitle={t("Ce închiriezi tu de la alții", "What you rent from others")} onNavigate={onNavigate}
        rows={[
          { icon: Send, title: t("Cereri trimise", "Sent requests"), desc: t("Așteaptă răspunsul proprietarului", "Awaiting the owner's reply"), to: "/rezervari?tab=requests", count: c?.renterPending },
          { icon: Package, title: t("Închirierile mele", "My rentals"), desc: t("Produse închiriate de tine", "Products you are renting"), to: "/rezervari?tab=active", count: c?.renterActive },
          { icon: Heart, title: t("Favorite", "Favorites"), desc: t("Anunțuri salvate", "Saved listings"), to: "/favorite" },
        ]} />
    </div>
  );
}
