import { useLanguage } from "@/contexts/LanguageContext";
import { ALL_CATEGORIES, getCategoryLabel, type NotificationCategory } from "@/lib/notificationCategory";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterValue = "all" | NotificationCategory;
export type ReadFilterValue = "all" | "unread" | "read";

interface Props {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  counts: Record<FilterValue, number>;
  readFilter?: ReadFilterValue;
  onReadChange?: (v: ReadFilterValue) => void;
  readCounts?: Record<ReadFilterValue, number>;
}

export function NotificationFilters({
  value,
  onChange,
  counts,
  readFilter,
  onReadChange,
  readCounts,
}: Props) {
  const { language, t } = useLanguage();

  const chips: { v: FilterValue; label: string }[] = [
    { v: "all", label: t("Toate", "All") },
    ...ALL_CATEGORIES.map((c) => ({ v: c as FilterValue, label: getCategoryLabel(c, language) })),
  ];

  const readChips: { v: ReadFilterValue; label: string }[] = [
    { v: "unread", label: t("Necitite", "Unread") },
    { v: "read", label: t("Citite", "Read") },
  ];

  const showReadRow = !!readFilter && !!onReadChange;

  const activeCategoryLabel =
    chips.find((c) => c.v === value)?.label ?? chips[0].label;
  const activeCategoryCount = counts[value] ?? 0;

  return (
    <div className="px-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      {showReadRow && (
        <div className="flex flex-wrap items-center gap-1.5">
          {readChips.map(({ v, label }) => {
            const active = readFilter === v;
            const count = readCounts?.[v] ?? 0;
            return (
              <button
                key={v}
                onClick={() => onReadChange?.(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
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
      )}
      <Select value={value} onValueChange={(v) => onChange(v as FilterValue)}>
        <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-full bg-muted/60 border-0 text-xs font-semibold">
          <SelectValue>
            <span className="inline-flex items-center gap-1.5">
              {activeCategoryLabel}
              {activeCategoryCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                  {activeCategoryCount > 99 ? "99+" : activeCategoryCount}
                </span>
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {chips.map(({ v, label }) => {
            const count = counts[v] ?? 0;
            return (
              <SelectItem key={v} value={v}>
                <span className="inline-flex items-center justify-between gap-3 w-full">
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold bg-foreground/10 text-foreground">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}