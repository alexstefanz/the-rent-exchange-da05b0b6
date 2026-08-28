import { supabase } from "@/integrations/supabase/client";

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
}


export interface WithdrawalContext {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
      };
  totalWithdrawn: number;
  productsCount: number;
  rentalsCount: number;
  previousRequests: WithdrawalRequest[];
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
    .select("id, full_name, email, phone, avatar_url")
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
  const [profileRes, prodRes, rentRes, prevRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at")
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
  ]);

  const previousRequests = ((prevRes.data || []) as any[])
    .map((r) => ({ ...r, amount: Number(r.amount) }) as WithdrawalRequest)
    .filter((r) => r.id !== currentRequestId);

  const totalWithdrawn = previousRequests
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + r.amount, 0);


  return {
    profile: (profileRes.data as any) || {
      id: userId,
      full_name: null,
      email: null,
      phone: null,
      avatar_url: null,
      created_at: null,
    },
    totalWithdrawn,
    productsCount: prodRes.count || 0,
    rentalsCount: rentRes.count || 0,
    previousRequests,
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
