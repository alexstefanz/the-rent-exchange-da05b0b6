import { Wallet, Heart, MessageCircle, Star, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  badge?: number;
  onClick: () => void;
}

const DashboardCard = ({ icon: Icon, label, value, badge, onClick }: DashboardCardProps) => (
  <Card
    className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group"
    onClick={onClick}
  >
    <CardContent className="flex flex-col items-center gap-2 p-4 sm:p-5">
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {!!badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-bold tracking-tight leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const BalanceCard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Balance query
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user!.id)
        .eq("status", "completed");
      if (error) throw error;
      let total = 0;
      for (const tx of data || []) {
        if (tx.type === "owner_payout") total += Number(tx.amount);
        else if (tx.type === "withdrawal") total -= Number(tx.amount);
      }
      return total;
    },
    enabled: !!user?.id,
  });

  // Favorites count
  const { data: favCount = 0, isLoading: favLoading } = useQuery({
    queryKey: ["favorites-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("favorite_products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Unread messages count
  const { data: unreadMsgCount = 0, isLoading: msgLoading } = useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      const { data: convos, error: convErr } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user!.id},owner_id.eq.${user!.id}`);
      if (convErr || !convos?.length) return 0;
      const convoIds = convos.map((c) => c.id);
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // New reviews count (last 30 days)
  const { data: newReviewsCount = 0, isLoading: reviewsLoading } = useQuery({
    queryKey: ["new-reviews-count", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count, error } = await supabase
        .from("user_reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewed_user_id", user!.id)
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Unread notifications count
  const { data: unreadNotifCount = 0, isLoading: notifLoading } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const isLoading = balanceLoading || favLoading || msgLoading || reviewsLoading || notifLoading;

  const skeletonCount = isMobile ? 4 : 5;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col items-center gap-2 p-4 sm:p-5">
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <DashboardCard
        icon={Wallet}
        label={t("Balanță", "Balance")}
        value={`${(balance ?? 0).toFixed(2)} RON`}
        onClick={() => navigate("/castiguri")}
      />
      <DashboardCard
        icon={Heart}
        label={t("Favorite", "Favorites")}
        value={favCount}
        badge={favCount}
        onClick={() => navigate("/favorite")}
      />
      <DashboardCard
        icon={MessageCircle}
        label={t("Mesaje", "Messages")}
        value={unreadMsgCount > 0 ? unreadMsgCount : t("0 noi", "0 new")}
        badge={unreadMsgCount}
        onClick={() => navigate("/mesaje")}
      />
      <DashboardCard
        icon={Star}
        label={t("Recenzii", "Reviews")}
        value={newReviewsCount > 0 ? newReviewsCount : t("0 noi", "0 new")}
        badge={newReviewsCount}
        onClick={() => navigate("/recenzii")}
      />
      <DashboardCard
        icon={Bell}
        label={t("Notificări", "Notifications")}
        value={unreadNotifCount > 0 ? unreadNotifCount : t("0 noi", "0 new")}
        badge={unreadNotifCount}
        onClick={() => navigate("/notificari")}
      />
    </div>
  );
};

export default BalanceCard;
