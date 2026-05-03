import { supabase } from "@/integrations/supabase/client";
import { fetchKycDocuments, type KycDocument } from "./kycApi";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  iban: string;
  account_holder: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface WithdrawalRow extends WithdrawalRequest {
  user_name: string;
  user_email: string;
  user_phone: string | null;
  user_avatar: string | null;
  kyc_status: string | null;
  kyc_level: string | null;
  kyc_last_verified_at: string | null;
}

export interface KycCaseLite {
  id: string;
  public_id: string;
  status: string;
  level_required: string;
  decided_at: string | null;
  created_at: string;
}

export interface WithdrawalContext {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
    kyc_status: string | null;
    kyc_level: string | null;
  };
  totalWithdrawn: number;
  productsCount: number;
  rentalsCount: number;
  previousRequests: WithdrawalRequest[];
  kycCase: KycCaseLite | null;
  kycDocuments: KycDocument[];
}

export interface WithdrawalFilters {
  status?: string;
  search?: string;
}

export const fetchAdminWithdrawals = async (filters: WithdrawalFilters = {}): Promise<WithdrawalRow[]> => {
  let q = supabase
    .from("withdrawal_requests" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data || []) as any as WithdrawalRequest[];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, kyc_status, kyc_level, kyc_last_verified_at")
    .in("id", userIds);
  const map = new Map((profiles || []).map((p: any) => [p.id, p]));

  let merged = rows.map((r) => {
    const p: any = map.get(r.user_id) || {};
    return {
      ...r,
      amount: Number(r.amount),
      user_name: p.full_name || "Utilizator",
      user_email: p.email || "",
      user_phone: p.phone || null,
      user_avatar: p.avatar_url || null,
      kyc_status: p.kyc_status || null,
      kyc_level: p.kyc_level || null,
      kyc_last_verified_at: p.kyc_last_verified_at || null,
    } as WithdrawalRow;
  });

  if (filters.search) {
    const s = filters.search.toLowerCase();
    merged = merged.filter(
      (r) =>
        r.user_name.toLowerCase().includes(s) ||
        r.user_email.toLowerCase().includes(s) ||
        r.iban.toLowerCase().includes(s) ||
        (r.account_holder || "").toLowerCase().includes(s),
    );
  }
  return merged;
};

export const fetchWithdrawalContext = async (
  userId: string,
  currentRequestId?: string,
): Promise<WithdrawalContext> => {
  const [profileRes, prodRes, rentRes, prevRes, kycRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at, kyc_status, kyc_level")
      .eq("id", userId)
      .single(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase
      .from("rentals")
      .select("id", { count: "exact", head: true })
      .or(`renter_id.eq.${userId},owner_id.eq.${userId}`),
    supabase
      .from("withdrawal_requests" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("kyc_cases" as any)
      .select("id, public_id, status, level_required, decided_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const previousRequests = ((prevRes.data || []) as any[])
    .map((r) => ({ ...r, amount: Number(r.amount) }) as WithdrawalRequest)
    .filter((r) => r.id !== currentRequestId);

  const totalWithdrawn = previousRequests
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + r.amount, 0);

  const kycCase = ((kycRes.data || []) as any[])[0] as KycCaseLite | undefined;
  let kycDocuments: KycDocument[] = [];
  if (kycCase) {
    try {
      kycDocuments = await fetchKycDocuments(kycCase.id);
    } catch (e) {
      console.error("[withdrawalsApi] kyc docs", e);
    }
  }

  return {
    profile: (profileRes.data as any) || {
      id: userId,
      full_name: null,
      email: null,
      phone: null,
      avatar_url: null,
      created_at: null,
      kyc_status: null,
      kyc_level: null,
    },
    totalWithdrawn,
    productsCount: prodRes.count || 0,
    rentalsCount: rentRes.count || 0,
    previousRequests,
    kycCase: kycCase || null,
    kycDocuments,
  };
};

export const updateWithdrawalStatus = async (
  id: string,
  status: "approved" | "rejected" | "completed",
  note?: string,
): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  const updates: Record<string, unknown> = { status, processed_by: userData.user?.id };
  if (status !== "rejected") updates.processed_at = new Date().toISOString();
  if (status === "rejected") updates.processed_at = new Date().toISOString();
  if (note) updates.admin_note = note;

  const { error } = await supabase.from("withdrawal_requests" as any).update(updates).eq("id", id);
  if (error) throw new Error(error.message);

  if (status === "completed") {
    const { data: wd } = await supabase
      .from("withdrawal_requests" as any)
      .select("user_id, amount, iban")
      .eq("id", id)
      .single();
    if (wd) {
      await supabase.from("transactions").insert({
        user_id: (wd as any).user_id,
        type: "withdrawal",
        amount: Number((wd as any).amount),
        status: "completed",
        description: `Retragere IBAN ${(wd as any).iban}`,
        processed_at: new Date().toISOString(),
      });
    }
  }
};

export const maskIban = (iban: string): string => {
  if (!iban) return "";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  const middle = "•".repeat(Math.max(4, clean.length - 8));
  return `${start} ${middle} ${end}`.replace(/(.{4})/g, "$1 ").trim();
};
