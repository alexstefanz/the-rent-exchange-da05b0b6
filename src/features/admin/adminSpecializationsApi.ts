import { supabase } from "@/integrations/supabase/client";

export const ADMIN_CATEGORY_GROUPS = [
  "RESERVATION",
  "PRODUCT",
  "FINANCIAL",
  "DISPUTE",
  "USER",
] as const;

export type AdminCategoryGroup = (typeof ADMIN_CATEGORY_GROUPS)[number];

export const CATEGORY_GROUP_LABELS_RO: Record<AdminCategoryGroup, string> = {
  RESERVATION: "Rezervări",
  PRODUCT: "Produse",
  FINANCIAL: "Financiar / plăți",
  DISPUTE: "Dispute / daune",
  USER: "Cont utilizator",
};

export interface AdminSpecialization {
  id: string;
  user_id: string;
  category_group: AdminCategoryGroup;
  created_at: string;
}

const table = () => supabase.from("admin_specializations" as any);

export async function fetchAdminSpecializations(userId: string): Promise<AdminSpecialization[]> {
  const { data, error } = await table()
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data || []) as unknown as AdminSpecialization[];
}

export async function setAdminSpecializations(
  userId: string,
  groups: AdminCategoryGroup[],
): Promise<void> {
  // Replace strategy: delete all then insert.
  const del = await table().delete().eq("user_id", userId);
  if (del.error) throw new Error(del.error.message);

  if (groups.length === 0) return;
  const rows = groups.map((g) => ({ user_id: userId, category_group: g }));
  const ins = await table().insert(rows);
  if (ins.error) throw new Error(ins.error.message);
}