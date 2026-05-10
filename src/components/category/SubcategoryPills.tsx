import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Sub {
  id: string;
  name: string;
  nameEn?: string;
}

interface Props {
  subcategories: Sub[];
  counts: Record<string, number>;
  total: number;
  selected: string;
  onSelect: (value: string) => void;
}

const SubcategoryPills = ({ subcategories, counts, total, selected, onSelect }: Props) => {
  const { t, language } = useLanguage();
  return (
    <div className="relative">
      {/* Edge fade hints */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent md:hidden" />

      <div
        className="flex gap-2 overflow-x-auto px-1 py-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "snap-start shrink-0 rounded-full px-4 h-10 text-sm font-medium transition-all duration-200 ring-1",
            selected === "all"
              ? "bg-foreground text-background ring-foreground scale-[1.02]"
              : "bg-card text-foreground ring-border/60 hover:ring-foreground/40",
          )}
        >
          {t("Toate", "All")} <span className="opacity-70 ml-1 tabular-nums">{total}</span>
        </button>
        {subcategories.map((s) => {
          const count = counts[s.name] || 0;
          const label = language === "en" && s.nameEn ? s.nameEn : s.name;
          const active = selected === s.name;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.name)}
              className={cn(
                "snap-start shrink-0 rounded-full px-4 h-10 text-sm font-medium transition-all duration-200 ring-1",
                active
                  ? "bg-foreground text-background ring-foreground scale-[1.02]"
                  : "bg-card text-foreground ring-border/60 hover:ring-foreground/40",
                count === 0 && !active && "opacity-50",
              )}
            >
              {label}
              <span className="opacity-70 ml-1 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubcategoryPills;
