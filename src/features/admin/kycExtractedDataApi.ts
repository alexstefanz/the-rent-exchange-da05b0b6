import { supabase } from "@/integrations/supabase/client";

export interface KycExtractedData {
  id: string;
  user_id: string;
  kyc_case_id: string | null;
  cnp: string | null;
  id_series: string | null;
  id_number: string | null;
  full_name: string | null;
  address: string | null;
  birth_date: string | null;
  issued_by: string | null;
  valid_until: string | null;
  extraction_model: string | null;
  extraction_confidence: number | null;
  extracted_at: string;
  verified_by_admin: boolean;
  verified_by_admin_id: string | null;
  verified_at: string | null;
}

export type KycExtractedEditable = Pick<
  KycExtractedData,
  "cnp" | "id_series" | "id_number" | "full_name" | "address" | "birth_date" | "issued_by" | "valid_until"
>;

export const fetchExtractedDataForUser = async (userId: string): Promise<KycExtractedData | null> => {
  const { data, error } = await (supabase
    .from("kyc_extracted_data" as any)
    .select("*") as any)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as KycExtractedData) || null;
};

export const triggerExtractIdData = async (kycCaseId: string): Promise<{ ok?: boolean; error?: string }> => {
  const { data, error } = await supabase.functions.invoke("extract-id-data", { body: { kyc_case_id: kycCaseId } });
  if (error) return { error: error.message };
  return data as any;
};

export const updateExtractedData = async (id: string, patch: Partial<KycExtractedEditable>): Promise<void> => {
  const { error } = await (supabase.from("kyc_extracted_data" as any).update(patch as any).eq("id", id) as any);
  if (error) throw new Error(error.message);
};

export const verifyExtractedData = async (id: string): Promise<void> => {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await (supabase
    .from("kyc_extracted_data" as any)
    .update({
      verified_by_admin: true,
      verified_by_admin_id: u.user?.id,
      verified_at: new Date().toISOString(),
    } as any)
    .eq("id", id) as any);
  if (error) throw new Error(error.message);
};

export const unverifyExtractedData = async (id: string): Promise<void> => {
  const { error } = await (supabase
    .from("kyc_extracted_data" as any)
    .update({ verified_by_admin: false, verified_at: null } as any)
    .eq("id", id) as any);
  if (error) throw new Error(error.message);
};