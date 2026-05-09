import { Link } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountDashboardData } from "@/hooks/useAccountDashboard";

export function AccountHealth({ data }: { data: AccountDashboardData }) {
  const { t, language } = useLanguage();
  const { items, completion } = data.health;

  return (
    <section className="rounded-[12px] border bg-card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold">{t("Stare cont", "Account health")}</h2>
        <span className="text-sm font-bold tabular-nums">
          {items.filter((i) => i.done).length}/{items.length}
        </span>
      </div>
      <Progress value={completion} className="h-2 mb-4" />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.href}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3 w-3 text-emerald-700" />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
                <span className={item.done ? "text-foreground" : "font-medium"}>
                  {language === "ro" ? item.labelRo : item.labelEn}
                </span>
              </span>
              {!item.done && (
                <span className="text-xs font-semibold text-[#F59E0B]">
                  {t("Adaugă", "Add")}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}