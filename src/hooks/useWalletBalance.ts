import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WalletBalance {
  total_earnings: number;
  pending_earnings: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  wallet_spent: number;
  available: number;
}

export const useWalletBalance = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["walletBalance", user?.id],
    enabled: !!user?.id,
    staleTime: 15_000,
    queryFn: async (): Promise<WalletBalance> => {
      const { data, error } = await supabase.rpc("get_user_wallet_balance" as any, {
        _user_id: user!.id,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        total_earnings: Number(row?.total_earnings ?? 0),
        pending_earnings: Number(row?.pending_earnings ?? 0),
        total_withdrawn: Number(row?.total_withdrawn ?? 0),
        pending_withdrawals: Number(row?.pending_withdrawals ?? 0),
        wallet_spent: Number(row?.wallet_spent ?? 0),
        available: Number(row?.available ?? 0),
      };
    },
  });
};
