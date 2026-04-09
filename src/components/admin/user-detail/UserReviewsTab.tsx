import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Props {
  userId: string;
}

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3 w-3 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
    ))}
  </div>
);

const UserReviewsTab = ({ userId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminUserReviews', userId],
    queryFn: async () => {
      const [received, given, productReviews] = await Promise.all([
        supabase.rpc('get_user_reviews_with_reviewers', { target_user_id: userId }),
        supabase.rpc('get_user_given_reviews_with_targets', { target_user_id: userId }),
        supabase
          .from('product_reviews')
          .select('*, profiles:reviewer_id(full_name, avatar_url), products:product_id(title)')
          .in('product_id', (await supabase.from('products').select('id').eq('owner_id', userId)).data?.map(p => p.id) || [])
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      return {
        received: received.data || [],
        given: given.data || [],
        productReviews: productReviews.data || [],
      };
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const { received = [], given = [], productReviews = [] } = data || {};
  const hasNone = !received.length && !given.length && !productReviews.length;

  if (hasNone) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nicio recenzie</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {received.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Recenzii primite ({received.length})</h4>
          <div className="space-y-2">
            {received.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg border flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.reviewer_avatar_url} />
                  <AvatarFallback className="text-xs">{r.reviewer_full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.reviewer_full_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground/70 mt-1">{format(new Date(r.created_at), "d MMM yyyy", { locale: ro })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {productReviews.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Recenzii produse ({productReviews.length})</h4>
          <div className="space-y-2">
            {productReviews.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg border flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">{r.profiles?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{r.profiles?.full_name}</span>
                    <Stars rating={r.rating} />
                    <Badge variant="outline" className="text-xs">{r.products?.title}</Badge>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground/70 mt-1">{format(new Date(r.created_at), "d MMM yyyy", { locale: ro })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {given.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Recenzii date ({given.length})</h4>
          <div className="space-y-2">
            {given.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg border flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.reviewed_avatar_url} />
                  <AvatarFallback className="text-xs">{r.reviewed_full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">→ {r.reviewed_full_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground/70 mt-1">{format(new Date(r.created_at), "d MMM yyyy", { locale: ro })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReviewsTab;
