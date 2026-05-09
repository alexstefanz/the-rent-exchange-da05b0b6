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

      const [rentalsRes, ticketsRes, txRes] = await Promise.all([
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
        supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", userId)
          .eq("status", "completed"),
      ]);

      let balance = 0;
      for (const tx of txRes.data || []) {
        if (tx.type === "owner_payout") balance += Number(tx.amount);
        else if (tx.type === "withdrawal") balance -= Number(tx.amount);
      }

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