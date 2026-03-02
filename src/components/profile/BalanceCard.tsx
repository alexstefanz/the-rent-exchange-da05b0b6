import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BalanceCard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: balance, isLoading } = useQuery({
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
        if (tx.type === "owner_payout") {
          total += Number(tx.amount);
        } else if (tx.type === "withdrawal") {
          total -= Number(tx.amount);
        }
      }
      return total;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {t("Balanța contului", "Account balance")}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {(balance ?? 0).toFixed(2)} RON
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
