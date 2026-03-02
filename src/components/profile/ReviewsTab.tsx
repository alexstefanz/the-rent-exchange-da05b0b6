import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserReviews, getUserGivenReviews } from "@/features/profile/reviewsApi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const ReviewsTab = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const dateLocale = language === "ro" ? ro : enUS;

  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: () => getUserReviews(user!.id),
    enabled: !!user?.id,
  });

  const { data: given = [], isLoading: loadingGiven } = useQuery({
    queryKey: ["user-given-reviews", user?.id],
    queryFn: () => getUserGivenReviews(user!.id),
    enabled: !!user?.id,
  });

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
      <p>{message}</p>
    </div>
  );

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-lg mb-4">
        <TabsTrigger value="received" className="rounded-md px-4 py-2">
          {t("Primite", "Received")} ({received.length})
        </TabsTrigger>
        <TabsTrigger value="given" className="rounded-md px-4 py-2">
          {t("Date", "Given")} ({given.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="mt-0 space-y-3">
        {loadingReceived ? renderSkeleton() : received.length === 0 ? renderEmpty(t("Nu ai primit încă nicio recenzie.", "You haven't received any reviews yet.")) : (
          received.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex gap-4 p-4">
                <Link to={`/user/${review.reviewer_id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link to={`/user/${review.reviewer_id}`} className="font-medium hover:underline truncate">
                      {review.reviewer?.full_name || t("Utilizator", "User")}
                    </Link>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="given" className="mt-0 space-y-3">
        {loadingGiven ? renderSkeleton() : given.length === 0 ? renderEmpty(t("Nu ai dat încă nicio recenzie.", "You haven't given any reviews yet.")) : (
          given.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex gap-4 p-4">
                <Link to={`/user/${review.reviewed_user_id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewed_user?.avatar_url || undefined} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link to={`/user/${review.reviewed_user_id}`} className="font-medium hover:underline truncate">
                      {review.reviewed_user?.full_name || t("Utilizator", "User")}
                    </Link>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ReviewsTab;
