import { Link } from "react-router-dom";
import { BellOff, Compass, PlusCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  variant?: "all" | "filtered";
  onAction?: () => void;
}

export function NotificationEmpty({ variant = "all", onAction }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <BellOff className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-bold text-foreground">
        {variant === "filtered" ? t("Nimic aici", "Nothing here") : t("Ești la zi", "You're all caught up")}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-[280px]">
        {variant === "filtered"
          ? t(
              "Nu sunt notificări pentru acest filtru.",
              "No notifications match this filter.",
            )
          : t(
              "Te anunțăm imediat ce se întâmplă ceva important.",
              "We'll let you know the moment something important happens.",
            )}
      </p>

      {variant === "all" && (
        <div className="mt-5 flex flex-col sm:flex-row items-stretch gap-2 w-full max-w-[280px]">
          <Link
            to="/categorii"
            onClick={onAction}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold hover:bg-muted/50 transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            {t("Caută", "Search")}
          </Link>
          <Link
            to="/owner/new-product"
            onClick={onAction}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {t("Adaugă anunț", "Add listing")}
          </Link>
        </div>
      )}
    </div>
  );
}