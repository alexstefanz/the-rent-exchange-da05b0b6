import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  accent?: "default" | "success" | "warning" | "destructive";
}

interface Props {
  title?: string;
  items: DrawerNavItem[];
  onNavigate: () => void;
  children?: ReactNode;
}

const accentMap: Record<string, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  destructive: "text-destructive",
};

export function DrawerNavGroup({ title, items, onNavigate, children }: Props) {
  return (
    <section className="px-2">
      {title && (
        <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[.98]",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : cn("hover:bg-muted/70", accentMap[item.accent || "default"])
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge !== 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          );
        })}
        {children}
      </ul>
    </section>
  );
}