import { Link } from "react-router-dom";
import { Package, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ListingsEmptyState = ({ filtered }: { filtered?: boolean }) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
        <h3 className="font-heading text-lg font-semibold">{t("Niciun rezultat", "No results")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("Modifică filtrele sau caută alt termen.", "Adjust filters or try a different search.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Package className="h-10 w-10 text-primary" />
      </div>
      <h3 className="font-heading text-2xl font-semibold">{t("Nu ai adăugat încă produse", "You haven't added products yet")}</h3>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t("Transformă obiectele nefolosite în venit pasiv. Durează doar câteva minute.", "Turn unused items into passive income. It only takes a few minutes.")}
      </p>
      <Button asChild size="lg" className="mt-6">
        <Link to="/owner/new-product"><Plus className="h-4 w-4" /> {t("Adaugă primul produs", "Add your first product")}</Link>
      </Button>
    </div>
  );
};

export default ListingsEmptyState;