import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserReviews, getUserGivenReviews } from "@/features/profile/reviewsApi";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

interface ProductReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  review_type: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  reviewer_id: string;
  product_title: string;
  product_id: string;
}

const ReviewsTab = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (roText: string, enText: string) => (language === "ro" ? roText : enText);
  const dateLocale = language === "ro" ? ro : enUS;

  // User reviews received
  const { data: userReceived = [], isLoading: loadingUserReceived } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: () => getUserReviews(user!.id),
    enabled: !!user?.id,
  });

  // User reviews given
  const { data: userGiven = [], isLoading: loadingUserGiven } = useQuery({
    queryKey: ["user-given-reviews", user?.id],
    queryFn: () => getUserGivenReviews(user!.id),
    enabled: !!user?.id,
  });

  // Product reviews received (on user's products)
  const { data: productReceived = [], isLoading: loadingProductReceived } = useQuery({
    queryKey: ["product-reviews-received", user?.id],
    queryFn: async () => {
      // Get user's products
      const { data: products } = await supabase
        .from("products")
        .select("id, title")
        .eq("owner_id", user!.id);
      if (!products?.length) return [];
      const productIds = products.map((p) => p.id);
      const productMap = new Map(products.map((p) => [p.id, p.title]));

      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("*, profiles:reviewer_id(full_name, avatar_url)")
        .in("product_id", productIds)
        .neq("reviewer_id", user!.id)
        .order("created_at", { ascending: false });

      return (reviews || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        review_type: r.review_type,
        reviewer_name: r.profiles?.full_name || null,
        reviewer_avatar: r.profiles?.avatar_url || null,
        reviewer_id: r.reviewer_id,
        product_title: productMap.get(r.product_id) || "",
        product_id: r.product_id,
      })) as ProductReviewItem[];
    },
    enabled: !!user?.id,
  });

  // Product reviews given by user
  const { data: productGiven = [], isLoading: loadingProductGiven } = useQuery({
    queryKey: ["product-reviews-given", user?.id],
    queryFn: async () => {
      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("*, products:product_id(title), profiles:reviewer_id(full_name, avatar_url)")
        .eq("reviewer_id", user!.id)
        .order("created_at", { ascending: false });

      return (reviews || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        review_type: r.review_type,
        reviewer_name: r.profiles?.full_name || null,
        reviewer_avatar: r.profiles?.avatar_url || null,
        reviewer_id: r.reviewer_id,
        product_title: r.products?.title || "",
        product_id: r.product_id,
      })) as ProductReviewItem[];
    },
    enabled: !!user?.id,
  });

  const loadingReceived = loadingUserReceived || loadingProductReceived;
  const loadingGiven = loadingUserGiven || loadingProductGiven;
  const totalReceived = userReceived.length + productReceived.length;
  const totalGiven = userGiven.length + productGiven.length;

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

  const renderProductReviewCard = (review: ProductReviewItem, showReviewer: boolean) => (
    <Card key={`pr-${review.id}`}>
      <CardContent className="flex gap-4 p-4">
        {showReviewer ? (
          <Link to={`/user/${review.reviewer_id}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewer_avatar || undefined} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-10 w-10">
            <AvatarFallback><Star className="h-4 w-4" /></AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              {showReviewer ? (
                <Link to={`/user/${review.reviewer_id}`} className="font-medium hover:underline truncate">
                  {review.reviewer_name || t("Utilizator", "User")}
                </Link>
              ) : (
                <span className="font-medium truncate">{review.product_title}</span>
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {t("Produs", "Product")}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
            </span>
          </div>
          {showReviewer && review.product_title && (
            <p className="text-xs text-muted-foreground">{t("Produs", "Product")}: {review.product_title}</p>
          )}
          <StarRating rating={review.rating} />
          {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-lg mb-4">
        <TabsTrigger value="received" className="rounded-md px-4 py-2">
          {t("Primite", "Received")} ({totalReceived})
        </TabsTrigger>
        <TabsTrigger value="given" className="rounded-md px-4 py-2">
          {t("Date", "Given")} ({totalGiven})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="mt-0 space-y-3">
        {loadingReceived ? renderSkeleton() : totalReceived === 0 ? renderEmpty(t("Nu ai primit încă nicio recenzie.", "You haven't received any reviews yet.")) : (
          <>
            {/* Product reviews received */}
            {productReceived.map((review) => renderProductReviewCard(review, true))}
            {/* User reviews received */}
            {userReceived.map((review) => (
              <Card key={`ur-${review.id}`}>
                <CardContent className="flex gap-4 p-4">
                  <Link to={`/user/${review.reviewer_id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link to={`/user/${review.reviewer_id}`} className="font-medium hover:underline truncate">
                          {review.reviewer?.full_name || t("Utilizator", "User")}
                        </Link>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {t("Utilizator", "User")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} />
                    {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </TabsContent>

      <TabsContent value="given" className="mt-0 space-y-3">
        {loadingGiven ? renderSkeleton() : totalGiven === 0 ? renderEmpty(t("Nu ai dat încă nicio recenzie.", "You haven't given any reviews yet.")) : (
          <>
            {/* Product reviews given */}
            {productGiven.map((review) => renderProductReviewCard(review, false))}
            {/* User reviews given */}
            {userGiven.map((review) => (
              <Card key={`ug-${review.id}`}>
                <CardContent className="flex gap-4 p-4">
                  <Link to={`/user/${review.reviewed_user_id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewed_user?.avatar_url || undefined} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link to={`/user/${review.reviewed_user_id}`} className="font-medium hover:underline truncate">
                          {review.reviewed_user?.full_name || t("Utilizator", "User")}
                        </Link>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {t("Utilizator", "User")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} />
                    {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ReviewsTab;
