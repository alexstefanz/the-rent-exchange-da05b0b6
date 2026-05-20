import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProductReviewBreakdown } from "@/hooks/queries/useProductExtendedStats";

interface Props { productId: string }

const ReviewSummaryCard = ({ productId }: Props) => {
  const { t } = useLanguage();
  const { data, isLoading } = useProductReviewBreakdown(productId);

  if (isLoading || !data || !data.count) return null;

  const avg = data.avg_rating ? Number(data.avg_rating).toFixed(1) : "—";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
        <span className="font-heading text-4xl font-bold text-foreground">{avg}</span>
        <span className="text-sm text-muted-foreground">
          · {data.count} {data.count === 1 ? t("recenzie", "review") : t("recenzii", "reviews")}
        </span>
      </div>
    </div>
  );
};

export default ReviewSummaryCard;
