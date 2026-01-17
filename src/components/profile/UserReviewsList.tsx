import { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { UserReview } from "@/features/profile/profileApi";

interface UserReviewsListProps {
  reviews: UserReview[];
  reviewerProfiles?: Record<string, { full_name: string | null; avatar_url: string | null }>;
}

const UserReviewsList = ({ reviews, reviewerProfiles = {} }: UserReviewsListProps) => {
  const [showAll, setShowAll] = useState(false);
  
  if (reviews.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recenzii</h3>
        <p className="text-muted-foreground text-center py-8">
          Acest utilizator nu are încă recenzii.
        </p>
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ro });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Recenzii ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {displayedReviews.map((review) => {
          const reviewer = reviewerProfiles[review.reviewer_id];
          
          return (
            <div
              key={review.id}
              className="border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <img
                  src={reviewer?.avatar_url || "/placeholder.svg"}
                  alt="Reviewer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {reviewer?.full_name || "Utilizator"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length > 3 && (
        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Arată mai puține
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Arată toate ({reviews.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default UserReviewsList;
