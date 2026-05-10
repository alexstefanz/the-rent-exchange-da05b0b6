import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const EmptyCategoryState = ({ onResetFilters, hasActiveFilters }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl bg-card p-10 text-center" style={{ boxShadow: "rgba(35,29,26,0.06) 0px 4px 24px -8px" }}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <SearchX className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground">
        {hasActiveFilters
          ? t("Nimic pe potriva filtrelor", "Nothing matches your filters")
          : t("Categoria e încă goală", "This category is empty")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {hasActiveFilters
          ? t("Încearcă să ajustezi filtrele sau să elimini unele criterii.", "Try adjusting or removing some filters.")
          : t("Fii primul care listează un produs aici.", "Be the first to list a product here.")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasActiveFilters && (
          <Button onClick={onResetFilters} className="rounded-full">
            {t("Resetează filtrele", "Reset filters")}
          </Button>
        )}
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/categorii">{t("Vezi toate categoriile", "Browse all categories")}</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <Link to="/owner/new-product">{t("Listează un produs", "List a product")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default EmptyCategoryState;
