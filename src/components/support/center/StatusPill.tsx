import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const STYLES: Record<string, { ro: string; en: string; cls: string }> = {
  NEW:                { ro: "Nou",                  en: "New",            cls: "bg-primary/10 text-primary" },
  IN_PROGRESS:        { ro: "În lucru",             en: "In progress",    cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  WAITING_CUSTOMER:   { ro: "Așteptăm răspunsul tău", en: "Waiting on you", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  WAITING_OWNER:      { ro: "În procesare",         en: "Processing",     cls: "bg-muted text-muted-foreground" },
  WAITING_INTERNAL:   { ro: "În procesare",         en: "Processing",     cls: "bg-muted text-muted-foreground" },
  RESOLVED:           { ro: "Rezolvat",             en: "Resolved",       cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  CLOSED:             { ro: "Închis",               en: "Closed",         cls: "bg-muted text-muted-foreground/80" },
};

export function StatusPill({ status, size = "sm", className }: { status: string; size?: "xs" | "sm"; className?: string }) {
  const { t } = useLanguage();
  const cfg = STYLES[status] || { ro: status, en: status, cls: "bg-muted text-muted-foreground" };
  const sizeCls = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span className={cn("inline-flex items-center font-medium rounded-full", sizeCls, cfg.cls, className)}>
      {t(cfg.ro, cfg.en)}
    </span>
  );
}

export const TICKET_STATUS_KEYS = Object.keys(STYLES);