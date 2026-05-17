import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProductReviewBreakdown } from "@/hooks/queries/useProductExtendedStats";

interface Props { productId: string }

const Bar = ({ label, value }: { label: string; value: number | null }) => {
  const pct = value ? (Number(value) / 5) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value ? Number(value).toFixed(1) : "—"}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
};

const ReviewSummaryCard = ({ productId }: Props) => {
  const { t } = useLanguage();
  const { data, isLoading } = useProductReviewBreakdown(productId);

  if (isLoading || !data || !data.count) return null;

  const avg = data.avg_rating ? Number(data.avg_rating).toFixed(1) : "—";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
            <span className="font-heading text-4xl font-bold text-foreground">{avg}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.count} {data.count === 1 ? t("recenzie", "review") : t("recenzii", "reviews")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Bar label={t("Comunicare", "Communication")} value={data.avg_communication} />
          <Bar label={t("Stare produs", "Condition")} value={data.avg_condition} />
        </div>
      </div>
    </div>
  );
};

export default ReviewSummaryCard;
