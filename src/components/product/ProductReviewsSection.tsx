import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, User } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const { language } = useLanguage();
  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={review.reviewer_avatar || undefined} />
          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{review.reviewer_name || "Utilizator"}</p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(review.created_at), "d MMM yyyy", language === "ro" ? { locale: ro } : undefined)}
          </span>
        </div>
        <StarRating value={review.rating} readonly />
      </div>
      {review.comment && (
        <p className="ml-12 text-sm text-foreground whitespace-pre-wrap">{review.comment}</p>
      )}
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

  // Realtime: refresh when a review for this product is added/updated/removed
  useEffect(() => {
    if (!productId) return;
    const ch = supabase
      .channel(`product-reviews-${productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews", filter: `product_id=eq.${productId}` },
        () => { void fetchReviews(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const totalCount = ownerReviews.length + renterReviews.length;
  const avgRating = totalCount > 0
    ? (([...ownerReviews, ...renterReviews].reduce((s, r) => s + r.rating, 0)) / totalCount).toFixed(1)
    : "0";

  const combinedReviews = [
    ...ownerReviews.map((r) => ({ review: r, type: "owner" as const })),
    ...renterReviews.map((r) => ({ review: r, type: "renter" as const })),
  ].sort((a, b) => new Date(b.review.created_at).getTime() - new Date(a.review.created_at).getTime());

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="reviews" className="border-b-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline font-heading text-base font-semibold">
            <div className="flex items-center gap-3">
              <span>
                {language === "ro" ? "Recenzii" : "Reviews"} ({totalCount})
              </span>
              {totalCount > 0 && (
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avgRating}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            {loading ? (
              <p className="text-sm text-muted-foreground py-2">
                {language === "ro" ? "Se încarcă..." : "Loading..."}
              </p>
            ) : combinedReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                {language === "ro" ? "Nu există recenzii momentan." : "No reviews yet."}
              </p>
            ) : (
              <div className="space-y-4">
                {combinedReviews.map(({ review }) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
