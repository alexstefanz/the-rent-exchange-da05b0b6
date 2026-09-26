import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  current: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  isFinal?: boolean;
  secondaryAction?: { label: string; onClick: () => void };
  error?: string | null;
}

const PublishFooter = ({ current, total, onBack, onNext, isLoading, nextLabel, isFinal, secondaryAction, error }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {error && (
        <div role="alert" className="mx-auto mt-3 max-w-3xl px-4">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>
        </div>
      )}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="min-h-11"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("Înapoi", "Back")}
        </Button>
        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            disabled={isLoading}
            className="min-h-11 text-muted-foreground"
          >
            {secondaryAction.label}
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={isLoading}
          size="lg"
          className="min-h-12 flex-1 gap-2 sm:flex-initial sm:px-8"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFinal ? (
            <Sparkles className="h-4 w-4" />
          ) : null}
          {nextLabel ?? (isFinal ? t("Publică anunțul", "Publish listing") : t("Continuă", "Continue"))}
          {!isFinal && !isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PublishFooter;