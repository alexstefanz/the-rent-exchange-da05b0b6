import { useLanguage } from "@/contexts/LanguageContext";
import { ALL_CATEGORIES, getCategoryLabel, type NotificationCategory } from "@/lib/notificationCategory";
import { cn } from "@/lib/utils";

export type FilterValue = "all" | NotificationCategory;

interface Props {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  counts: Record<FilterValue, number>;
}

export function NotificationFilters({ value, onChange, counts }: Props) {
  const { language, t } = useLanguage();

  const chips: { v: FilterValue; label: string }[] = [
    { v: "all", label: t("Toate", "All") },
    ...ALL_CATEGORIES.map((c) => ({ v: c as FilterValue, label: getCategoryLabel(c, language) })),
  ];

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {chips.map(({ v, label }) => {
        const active = value === v;
        const count = counts[v] ?? 0;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              active
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold",
                  active ? "bg-background/20 text-background" : "bg-foreground/10 text-foreground",
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}