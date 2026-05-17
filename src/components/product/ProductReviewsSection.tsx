import { useState, useEffect } from "react";
import { Star, User, Info } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getProductReviews,
  createProductReview,
  ProductReview,
} from "@/features/products/productReviewsApi";

interface Props {
  productId: string;
  isOwnProduct: boolean;
}

const CRITERIA = [
  { key: "condition" as const, labelRo: "Stare produs", labelEn: "Product condition" },
  { key: "communication" as const, labelRo: "Comunicare", labelEn: "Communication" },
  { key: "punctuality" as const, labelRo: "Punctualitate", labelEn: "Punctuality" },
];

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted"} ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(i)}
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
  const { user } = useAuth();
  const { language } = useLanguage();
  const [ownerReviews, setOwnerReviews] = useState<ProductReview[]>([]);
  const [renterReviews, setRenterReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasCompletedRental, setHasCompletedRental] = useState(false);

  // Form state
  const [ratings, setRatings] = useState({ condition: 0, communication: 0, punctuality: 0 });
  const [comment, setComment] = useState("");

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

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || isOwnProduct) return;
      const { count } = await supabase
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user.id)
        .eq("product_id", productId)
        .eq("status", "completed");
      setHasCompletedRental((count || 0) > 0);
    };
    checkEligibility();
  }, [user, productId, isOwnProduct]);

  const canSubmit = ratings.condition > 0 && ratings.communication > 0 && ratings.punctuality > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createProductReview(productId, "owner", ratings, comment);
      toast({ title: language === "ro" ? "Recenzie adăugată!" : "Review added!" });
      setRatings({ condition: 0, communication: 0, punctuality: 0 });
      setComment("");
      await fetchReviews();
    } catch (e: any) {
      toast({ title: language === "ro" ? "Eroare" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Add review form */}
      {user && !isOwnProduct && hasCompletedRental && (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-medium text-foreground mb-3">
            {language === "ro" ? "Adaugă o recenzie" : "Add a review"}
          </h3>
          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">{language === "ro" ? c.labelRo : c.labelEn}</span>
                <StarRating value={ratings[c.key]} onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))} />
              </div>
            ))}
            <Textarea
              placeholder={language === "ro" ? "Alte detalii (opțional)" : "Other details (optional)"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              maxLength={500}
            />
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full sm:w-auto">
              {submitting
                ? (language === "ro" ? "Se trimite..." : "Submitting...")
                : (language === "ro" ? "Trimite recenzia" : "Submit review")}
            </Button>
          </div>
        </div>
      )}

      {user && !isOwnProduct && !hasCompletedRental && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <span>{language === "ro" ? "Poți lăsa o recenzie după finalizarea unei închirieri." : "You can leave a review after completing a rental."}</span>
          </div>
        </div>
      )}
    </div>
  );
}
