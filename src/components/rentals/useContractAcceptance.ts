import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractAcceptance { role: "owner" | "renter"; accepted_at: string }

export function useContractAcceptance(rentalId?: string) {
  const qc = useQueryClient();
  const key = ["rental-contract-acceptance", rentalId];
  const q = useQuery({
    queryKey: key,
    enabled: !!rentalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_contract_acceptances")
        .select("role, accepted_at")
        .eq("rental_id", rentalId!);
      if (error) throw error;
      return (data ?? []) as ContractAcceptance[];
    },
  });

  useEffect(() => {
    if (!rentalId) return;
    const ch = supabase
      .channel(`contract-acc-${rentalId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_contract_acceptances", filter: `rental_id=eq.${rentalId}` },
        () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId]);

  const owner = q.data?.find((a) => a.role === "owner")?.accepted_at ?? null;
  const renter = q.data?.find((a) => a.role === "renter")?.accepted_at ?? null;

  const accept = async () => {
    const { error } = await supabase.rpc("accept_rental_contract", { p_rental_id: rentalId!, p_user_agent: navigator.userAgent });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: key });
  };

  return { owner, renter, bothAccepted: !!owner && !!renter, loading: q.isLoading, accept };
}
