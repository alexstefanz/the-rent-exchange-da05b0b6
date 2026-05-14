import { Link } from "react-router-dom";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ListingsHeader = ({ totalCount }: { totalCount: number }) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  return (
    <header className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Store className="h-3 w-3" />
            {t("Ca proprietar", "As owner")}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("Produsele mele", "My listings")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {t(
              `Gestionează cele ${totalCount} anunțuri ale tale, disponibilitatea și performanța lor.`,
              `Manage your ${totalCount} listings, availability and performance.`,
            )}
          </p>
        </div>
        <Button asChild size="lg" className="hidden sm:inline-flex">
          <Link to="/owner/new-product">
            <Plus className="h-4 w-4" />
            {t("Adaugă produs", "Add product")}
          </Link>
        </Button>
      </div>
    </header>
  );
};

export default ListingsHeader;