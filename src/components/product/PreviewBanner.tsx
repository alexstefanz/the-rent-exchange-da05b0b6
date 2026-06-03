import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const PreviewBanner = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleClose = () => {
    try {
      window.close();
    } catch {
      /* noop */
    }
    // Fallback if window.close() is blocked (e.g. tab wasn't opened by script)
    setTimeout(() => {
      if (!window.closed) navigate(-1);
    }, 100);
  };

  return (
    <div className="sticky top-0 z-[60] border-b border-primary/30 bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/15">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Eye className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {t("Previzualizare anunț", "Listing preview")}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {t(
                "Anunțul nu este încă publicat. Doar tu vezi această pagină.",
                "This listing isn't published yet. Only you can see this page.",
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="shrink-0 gap-1.5 text-foreground hover:bg-primary/20"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t("Închide previzualizarea", "Close preview")}</span>
          <span className="sm:hidden">{t("Închide", "Close")}</span>
        </Button>
      </div>
    </div>
  );
};

export default PreviewBanner;