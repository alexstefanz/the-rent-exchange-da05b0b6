import { useEffect, useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUxCopy } from "@/hooks/useUxCopy";
import { supabase } from "@/integrations/supabase/client";
import { createProductReview } from "@/features/products/productReviewsApi";
import { createUserReview } from "@/features/profile/reviewsApi";

export interface LeaveReviewRental {
  id: string;
  product_id: string | null;
  product_title: string;
  counterparty_id: string | null;
  counterparty_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: LeaveReviewRental | null;
  /** "renter" = current user is the renter reviewing the owner.
   *  "owner"  = current user is the owner reviewing the renter. */
  currentUserRole: "renter" | "owner";
}

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          className={`transition-transform ${disabled ? "" : "hover:scale-110"}`}
          aria-label={`${i} stele`}
        >
          <Star
            className={`h-6 w-6 ${
              i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function LeaveReviewDialog({
  open,
  onOpenChange,
  rental,
  currentUserRole,
}: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = useUxCopy();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productReviewExists, setProductReviewExists] = useState(false);
  const [userReviewExists, setUserReviewExists] = useState(false);

  // Product review state (multi-criteria)
  const [condition, setCondition] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [productComment, setProductComment] = useState("");

  // User review state (single rating)
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");

  const reviewType: "owner" | "renter" =
    currentUserRole === "renter" ? "owner" : "renter";

  // Reset & check existing reviews when dialog opens
  useEffect(() => {
    if (!open || !rental || !user) return;

    setLoading(true);
    setCondition(0);
    setCommunication(0);
    setPunctuality(0);
    setProductComment("");
    setUserRating(0);
    setUserComment("");

    (async () => {
      try {
        const [{ count: prCount }, { count: urCount }] = await Promise.all([
          rental.product_id
            ? supabase
                .from("product_reviews")
                .select("id", { count: "exact", head: true })
                .eq("reviewer_id", user.id)
                .eq("product_id", rental.product_id)
                .eq("review_type", reviewType)
            : Promise.resolve({ count: 0 } as any),
          rental.counterparty_id
            ? supabase
                .from("user_reviews")
                .select("id", { count: "exact", head: true })
                .eq("reviewer_id", user.id)
                .eq("reviewed_user_id", rental.counterparty_id)
            : Promise.resolve({ count: 0 } as any),
        ]);
        setProductReviewExists((prCount || 0) > 0);
        setUserReviewExists((urCount || 0) > 0);
      } catch (e) {
        console.error("Failed to check existing reviews:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, rental, user, reviewType]);

  if (!rental) return null;

  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  const productReady =
    productReviewExists ||
    (condition > 0 && communication > 0 && punctuality > 0);
  const userReady = userReviewExists || userRating > 0;
  const canSubmit =
    !loading && !submitting && productReady && userReady &&
    !(productReviewExists && userReviewExists);

  const handleSubmit = async () => {
    if (!canSubmit || !rental) return;
    setSubmitting(true);
    let productOk = productReviewExists;
    let userOk = userReviewExists;
    let firstError: string | null = null;

    try {
      if (!productReviewExists && rental.product_id) {
        try {
          await createProductReview(
            rental.product_id,
            reviewType,
            { condition, communication, punctuality },
            productComment.trim()
          );
          productOk = true;
        } catch (e: any) {
          firstError = e?.message || t("Eroare la review-ul produsului.", "Failed to submit product review.");
        }
      }

      if (!userReviewExists && rental.counterparty_id) {
        try {
          await createUserReview(
            rental.counterparty_id,
            userRating,
            userComment.trim() || undefined,
            rental.product_title
          );
          userOk = true;
        } catch (e: any) {
          if (!firstError) {
            firstError = e?.message || t("Eroare la review-ul utilizatorului.", "Failed to submit user review.");
          }
        }
      }

      if (productOk && userOk) {
        toast.success(t("Mulțumim pentru feedback!", "Thanks for your feedback!"));
        queryClient.invalidateQueries({ queryKey: ["accountDashboard"] });
        queryClient.invalidateQueries({ queryKey: ["my-rentals"] });
        queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
        queryClient.invalidateQueries({ queryKey: ["userReviews"] });
        queryClient.invalidateQueries({ queryKey: ["productReviews", rental.product_id] });
        onOpenChange(false);
      } else if (firstError) {
        toast.error(firstError);
        setProductReviewExists(productOk);
        setUserReviewExists(userOk);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const bothDone = productReviewExists && userReviewExists;

  const snoozeKey = rental ? `leaveReviewSnooze:${rental.id}` : null;
  const handleSnooze = (days = 1) => {
    if (!snoozeKey) return;
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(snoozeKey, String(until));
    } catch {}
    toast.success(copy.timeline.review.snoozedToast);
    onOpenChange(false);
  };
  const handleSkip = () => {
    if (!snoozeKey) return;
    try {
      // far-future snooze acts as a skip for this rental
      localStorage.setItem(snoozeKey, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
    } catch {}
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Lasă un review", "Leave a review")}</DialogTitle>
          <DialogDescription>
            {t(
              "Părerea ta ajută comunitatea Rentli să rămână de încredere.",
              "Your feedback keeps the Rentli community trustworthy."
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : bothDone ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-medium text-foreground">
              {t("Ai lăsat deja review pentru această închiriere.", "You already reviewed this rental.")}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("Închide", "Close")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product / experience */}
            <section className="rounded-xl border border-border p-4">
              <header className="mb-3">
                <h3 className="font-semibold text-foreground">
                  {t("Despre produs", "About the product")}
                </h3>
                <p className="text-xs text-muted-foreground">{rental.product_title}</p>
              </header>

              {productReviewExists ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("Review trimis pentru acest produs.", "Review already sent for this product.")}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: "condition", labelRo: "Stare produs", labelEn: "Product condition", value: condition, set: setCondition },
                    { key: "communication", labelRo: "Comunicare", labelEn: "Communication", value: communication, set: setCommunication },
                    { key: "punctuality", labelRo: "Punctualitate", labelEn: "Punctuality", value: punctuality, set: setPunctuality },
                  ].map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {t(c.labelRo, c.labelEn)}
                      </span>
                      <StarPicker value={c.value} onChange={c.set} disabled={submitting} />
                    </div>
                  ))}
                  <Textarea
                    placeholder={t("Comentariu opțional", "Optional comment")}
                    value={productComment}
                    onChange={(e) => setProductComment(e.target.value)}
                    maxLength={500}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
              )}
            </section>

            {/* Counterparty user */}
            <section className="rounded-xl border border-border p-4">
              <header className="mb-3">
                <h3 className="font-semibold text-foreground">
                  {t(
                    `Despre ${rental.counterparty_name}`,
                    `About ${rental.counterparty_name}`
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentUserRole === "renter"
                    ? t("Proprietarul produsului", "The product owner")
                    : t("Chiriașul", "The renter")}
                </p>
              </header>

              {userReviewExists ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("Review trimis pentru acest utilizator.", "Review already sent for this user.")}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("Evaluare generală", "Overall rating")}
                    </span>
                    <StarPicker value={userRating} onChange={setUserRating} disabled={submitting} />
                  </div>
                  <Textarea
                    placeholder={t("Comentariu opțional", "Optional comment")}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    maxLength={500}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && !bothDone && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={submitting}>
                {copy.timeline.review.skip}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSnooze(1)} disabled={submitting}>
                {copy.timeline.review.snooze}
              </Button>
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Trimite review", "Submit review")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}