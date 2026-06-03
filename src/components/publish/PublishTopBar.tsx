import { Loader2, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  saveStatus: "idle" | "saving" | "saved";
  lastSavedAt: Date | null;
  onExit: () => void;
  mode: "create" | "edit";
  onPreview?: () => void;
  canPreview?: boolean;
}

const PublishTopBar = ({ saveStatus, lastSavedAt, onExit, mode, onPreview, canPreview }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-lg font-bold text-foreground"
        >
          <span className="text-primary">Rentli</span>
        </button>

        <div className="hidden flex-1 items-center justify-center gap-2 text-sm text-muted-foreground md:flex">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              {t("Se salvează draftul…", "Saving draft…")}
            </>
          )}
          {saveStatus === "saved" && lastSavedAt && (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {t("Toate modificările sunt salvate", "All changes saved")}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPreview}
                    disabled={!canPreview}
                    className="gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("Previzualizează anunțul", "Preview listing")}</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {!canPreview && (
                <TooltipContent>
                  {t(
                    "Adaugă titlu, categorie și o imagine pentru a previzualiza",
                    "Add title, category and one image to preview",
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          )}
          <Button variant="ghost" size="sm" onClick={onExit} className="hidden sm:inline-flex">
            {mode === "create" ? t("Salvează și ieși", "Save and exit") : t("Ieși", "Exit")}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} aria-label={t("Închide", "Close")}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PublishTopBar;