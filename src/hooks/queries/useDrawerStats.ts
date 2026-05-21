import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DrawerStats {
  activeRentals: number;
  openTickets: number;
  balance: number;
}

export function useDrawerStats(userId: string | undefined) {
  return useQuery<DrawerStats>({
    queryKey: ["drawer-stats", userId],
    queryFn: async () => {
      if (!userId) return { activeRentals: 0, openTickets: 0, balance: 0 };

      const [rentalsRes, ticketsRes, walletRes] = await Promise.all([
        supabase
          .from("rentals")
          .select("id", { count: "exact", head: true })
          .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
          .in("status", ["confirmed", "in_progress", "active"]),
        supabase
          .from("ops_tickets")
          .select("id", { count: "exact", head: true })
          .eq("requester_user_id", userId)
          .in("status", ["NEW", "OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]),
        supabase.rpc("get_user_wallet_balance" as any, { _user_id: userId }),
      ]);

      const walletRow: any = Array.isArray(walletRes.data) ? walletRes.data[0] : walletRes.data;
      const balance = Number(walletRow?.available ?? 0);

      return {
        activeRentals: rentalsRes.count ?? 0,
        openTickets: ticketsRes.count ?? 0,
        balance,
      };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}