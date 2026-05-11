import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  current: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  isFinal?: boolean;
}

const PublishFooter = ({ current, total, onBack, onNext, isLoading, nextLabel, isFinal }: Props) => {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={current === 1 || isLoading}
          className="min-h-11"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Înapoi
        </Button>
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
          {nextLabel ?? (isFinal ? "Publică anunțul" : "Continuă")}
          {!isFinal && !isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PublishFooter;