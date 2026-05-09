import { format, isToday, isYesterday } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

export function DateSeparator({ date }: { date: string | Date }) {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const d = typeof date === "string" ? new Date(date) : date;
  let label: string;
  if (isToday(d)) label = t("Astăzi", "Today");
  else if (isYesterday(d)) label = t("Ieri", "Yesterday");
  else label = format(d, "d MMM yyyy", { locale });

  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-background/70 backdrop-blur-md border border-border/50 text-muted-foreground">
        {label}
      </span>
    </div>
  );
}