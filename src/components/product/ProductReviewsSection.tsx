import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getProductReviews,
  ProductReview,
} from "@/features/products/productReviewsApi";

interface Props {
  productId: string;
  isOwnProduct: boolean;
}

function StarRating({ value, readonly = false }: { value: number; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={review.reviewer_avatar || undefined} />
          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{review.reviewer_name || "Utilizator"}</p>
          <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), "d MMM yyyy", { locale: ro })}</span>
        </div>
      </div>
      <div className="space-y-1 ml-12 text-sm">
        {review.rating_product_condition && (
          <div className="flex items-center gap-2"><span className="text-muted-foreground w-28">Stare produs</span><StarRating value={review.rating_product_condition} readonly /></div>
        )}
        {review.rating_communication && (
          <div className="flex items-center gap-2"><span className="text-muted-foreground w-28">Comunicare</span><StarRating value={review.rating_communication} readonly /></div>
        )}
        {review.rating_punctuality && (
          <div className="flex items-center gap-2"><span className="text-muted-foreground w-28">Punctualitate</span><StarRating value={review.rating_punctuality} readonly /></div>
        )}
      </div>
      {review.comment && <p className="mt-2 ml-12 text-sm text-muted-foreground">{review.comment}</p>}
    </div>
  );
}

export default function ProductReviewsSection({ productId, isOwnProduct }: Props) {
  const { language } = useLanguage();
  const [ownerReviews, setOwnerReviews] = useState<ProductReview[]>([]);
  const [renterReviews, setRenterReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const data = await getProductReviews(productId);
      setOwnerReviews(data.owner);
      setRenterReviews(data.renter);
    } catch (e) {
      console.error("Error fetching reviews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const totalCount = ownerReviews.length + renterReviews.length;
  const avgRating = totalCount > 0
    ? (([...ownerReviews, ...renterReviews].reduce((s, r) => s + r.rating, 0)) / totalCount).toFixed(1)
    : "0";

  const combinedReviews = [
    ...ownerReviews.map((r) => ({ review: r, type: "owner" as const })),
    ...renterReviews.map((r) => ({ review: r, type: "renter" as const })),
  ].sort((a, b) => new Date(b.review.created_at).getTime() - new Date(a.review.created_at).getTime());

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {language === "ro" ? "Recenzii" : "Reviews"} ({totalCount})
        </h2>
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{avgRating}</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">{language === "ro" ? "Se încarcă..." : "Loading..."}</p>
      ) : combinedReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {language === "ro" ? "Nu există recenzii momentan." : "No reviews yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {combinedReviews.map(({ review }) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
