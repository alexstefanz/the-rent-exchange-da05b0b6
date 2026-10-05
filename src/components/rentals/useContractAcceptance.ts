import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractAcceptance {
  role: "owner" | "renter"; accepted_at: string; signature_data: string | null;
  validation_channel: string | null; validation_destination: string | null; validation_ref: string | null; validated_at: string | null;
}

export function useContractAcceptance(rentalId?: string) {
  const qc = useQueryClient();
  const key = ["rental-contract-acceptance", rentalId];
  const q = useQuery({
    queryKey: key,
    enabled: !!rentalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_contract_acceptances")
        .select("role, accepted_at, signature_data, validation_channel, validation_destination, validation_ref, validated_at")
        .eq("rental_id", rentalId!);
      if (error) throw error;
      return (data ?? []) as ContractAcceptance[];
    },
  });

  useEffect(() => {
    if (!rentalId) return;
    const ch = supabase
      .channel(`contract-acc-${rentalId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_contract_acceptances", filter: `rental_id=eq.${rentalId}` },
        () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId]);

  const ownerRow = q.data?.find((a) => a.role === "owner");
  const renterRow = q.data?.find((a) => a.role === "renter");

  const sign = async (signature: string, code: string) => {
    const { data, error } = await supabase.rpc("verify_and_sign_rental_contract", {
      p_rental_id: rentalId!, p_code: code, p_signature: signature, p_user_agent: navigator.userAgent,
    });
    if (error) throw error;
    const res = data as { ok?: boolean; error?: string } | null;
    if (!res?.ok) throw new Error(res?.error || "Cod incorect");
    await qc.invalidateQueries({ queryKey: key });
    const { data: rows } = await supabase
      .from("rental_contract_acceptances").select("role").eq("rental_id", rentalId!);
    const roles = new Set((rows ?? []).map((r: any) => r.role));
    return { bothAccepted: roles.has("owner") && roles.has("renter") };
  };

  return {
    owner: ownerRow?.accepted_at ?? null,
    renter: renterRow?.accepted_at ?? null,
    ownerSig: ownerRow?.signature_data ?? null,
    renterSig: renterRow?.signature_data ?? null,
    ownerRow, renterRow,
    bothAccepted: !!ownerRow && !!renterRow,
    loading: q.isLoading,
    sign,
  };
}
