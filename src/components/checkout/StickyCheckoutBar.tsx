import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  total: number;
  ctaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const StickyCheckoutBar = ({ total, ctaLabel, onClick, disabled, loading }: Props) => {
  const { t } = useLanguage();
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("Total", "Total")}</div>
          <div className="font-bold text-foreground text-lg leading-tight tabular-nums">{total} RON</div>
        </div>
        <Button
          onClick={onClick}
          disabled={disabled || loading}
          className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20"
        >
          {loading ? t("Se procesează...", "Processing...") : ctaLabel}
        </Button>
      </div>
    </div>
  );
};

export default StickyCheckoutBar;