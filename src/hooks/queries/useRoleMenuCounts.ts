import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FINAL = ["completed", "cancelled", "rejected"];

export interface RoleMenuCounts {
  listings: number;
  ownerPending: number;
  ownerActive: number;
  renterPending: number;
  renterActive: number;
}

export function useRoleMenuCounts(userId?: string) {
  const qc = useQueryClient();
  const key = ["role-menu-counts", userId];

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<RoleMenuCounts> => {
      const [listings, rentals] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true })
          .eq("owner_id", userId!).is("deleted_at", null),
        supabase.from("rentals").select("status, owner_id, renter_id")
          .or(`owner_id.eq.${userId},renter_id.eq.${userId}`)
          .not("status", "in", `(${FINAL.join(",")})`),
      ]);
      const c: RoleMenuCounts = { listings: listings.count ?? 0, ownerPending: 0, ownerActive: 0, renterPending: 0, renterActive: 0 };
      for (const r of (rentals.data ?? []) as any[]) {
        const pending = r.status === "pending";
        if (r.owner_id === userId) pending ? c.ownerPending++ : c.ownerActive++;
        else if (r.renter_id === userId) pending ? c.renterPending++ : c.renterActive++;
      }
      return c;
    },
  });

  useEffect(() => {
    if (!userId) return;
    const refresh = () => qc.invalidateQueries({ queryKey: ["role-menu-counts", userId] });
    const ch = supabase
      .channel(`role-menu-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals", filter: `owner_id=eq.${userId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals", filter: `renter_id=eq.${userId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `owner_id=eq.${userId}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  return query;
}
