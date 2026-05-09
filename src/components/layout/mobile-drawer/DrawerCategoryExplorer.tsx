import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onNavigate: () => void;
}

export function DrawerCategoryExplorer({ onNavigate }: Props) {
  const { t, language } = useLanguage();
  const popular = categories.slice(0, 6);

  return (
    <section className="px-2">
      <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("Categorii populare", "Popular categories")}
      </h3>
      <div className="flex flex-wrap gap-1.5 px-1">
        {popular.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const name = language === "en" ? cat.nameEn : cat.name;
          return (
            <Link
              key={cat.id}
              to={`/categorie/${cat.slug}`}
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
            >
              <Icon className="h-3.5 w-3.5" />
              {name}
            </Link>
          );
        })}
      </div>
      <Link
        to="/categorii"
        onClick={onNavigate}
        className="mt-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 active:scale-[.98]"
      >
        {t("Vezi toate categoriile", "View all categories")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}