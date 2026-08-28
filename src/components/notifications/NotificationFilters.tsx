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
    { v: "all", label: t("Toate", "All") },
    { v: "unread", label: t("Necitite", "Unread") },
    { v: "read", label: t("Citite", "Read") },
  ];

  const showReadRow = !!readFilter && !!onReadChange;

  const activeCategoryLabel = chips.find((c) => c.v === value)?.label ?? chips[0].label;

  return (
    <div className="px-4 flex items-end justify-between gap-2 border-b border-border/60">
      {showReadRow && (
        <div className="flex items-end gap-4 -mb-px">
          {readChips.map(({ v, label }) => {
            const active = readFilter === v;
            const count = readCounts?.[v] ?? 0;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onReadChange?.(v)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 pb-2.5 pt-1 text-[13px] transition-colors",
                  active
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    active ? "text-primary" : "text-muted-foreground/60",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
                <span
                  className={cn(
                    "absolute left-0 right-0 -bottom-px h-[2px] rounded-full transition-opacity",
                    active ? "bg-primary opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="pb-1.5 shrink-0">
        <Select value={value} onValueChange={(v) => onChange(v as FilterValue)}>
          <SelectTrigger className="w-auto h-7 gap-1 rounded-full border-0 bg-transparent px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground focus:ring-0">
            <SelectValue>{activeCategoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={6} align="end" className="max-h-64">
            {chips.map(({ v, label }) => {
              const count = counts[v] ?? 0;
              return (
                <SelectItem key={v} value={v}>
                  <span className="inline-flex items-center justify-between gap-3 w-full">
                    <span>{label}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
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
    </div>
  );
}
