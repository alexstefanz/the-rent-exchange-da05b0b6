import { Check, Sparkles } from "lucide-react";
import { computeQualityScore } from "@/lib/qualityScore";
import type { PublishFormData } from "@/lib/publishTypes";
import { cn } from "@/lib/utils";

const QualityScoreCard = ({ data }: { data: PublishFormData }) => {
  const score = computeQualityScore(data);
  const level =
    score.total >= 85 ? "Excelent" : score.total >= 60 ? "Bun" : score.total >= 35 ? "În progres" : "La început";
  const color =
    score.total >= 85
      ? "text-emerald-600"
      : score.total >= 60
        ? "text-primary"
        : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Scor calitate anunț</h3>
        </div>
        <span className={cn("text-2xl font-bold", color)}>{score.total}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-500",
            score.total >= 85 ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${score.total}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Nivel: <span className={cn("font-medium", color)}>{level}</span>
      </p>

      {score.suggestions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {score.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-1.5">
        {score.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full",
                item.done ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground/60",
              )}
            >
              {item.done && <Check className="h-3 w-3" />}
            </span>
            <span className={cn(item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityScoreCard;