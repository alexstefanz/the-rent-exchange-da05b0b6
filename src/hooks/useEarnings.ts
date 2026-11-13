import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TxStatus = "available" | "pending" | "held" | "cancelled";

export interface EarningsTransaction {
  id: string;
  rentalPublicId: string | null;
  productId: string | null;
  productTitle: string;
  productImage: string | null;
  renterId: string | null;
  renterName: string | null;
  renterAvatar: string | null;
  startDate: string | null;
  endDate: string | null;
  subtotal: number;
  platformFee: number;
  ownerPayout: number;
  paymentStatus: string;
  rentalStatus: string;
  date: string;
  status: TxStatus;
}

export interface WithdrawalRow {
  id: string;
  amount: number;
  iban: string;
  account_holder: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
}

export interface EarningsData {
  totalThisMonth: number;
  totalAllTime: number;
  pendingEarnings: number;
  totalRentals: number;
  availableBalance: number;
  withdrawableBalance: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
}

export interface PayoutMethod {
  iban: string;
  accountHolder: string;
}

interface ProfilePayoutRow {
  iban: string | null;
  account_holder_name: string | null;
}

interface WithdrawalRequestRecord {
  id: string;
  amount: number | string;
  iban: string;
  account_holder: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
}

interface RentalRecord {
  id: string;
  public_id: string | null;
  owner_payout: number | string | null;
  subtotal: number | string | null;
  platform_fee: number | string | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  product_id: string | null;
  renter_id: string | null;
  is_test_payment: boolean | null;
  handover_confirmed_at: string | null;
  products?: { title?: string | null; images?: string[] | null } | null;
}

interface RenterProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface WalletRpcRow {
  total_earnings?: number | string | null;
  pending_earnings?: number | string | null;
  total_withdrawn?: number | string | null;
  pending_withdrawals?: number | string | null;
  available?: number | string | null;
  withdrawable?: number | string | null;
}

const empty: EarningsData = {
  totalThisMonth: 0,
  totalAllTime: 0,
  pendingEarnings: 0,
  totalRentals: 0,
  availableBalance: 0,
  withdrawableBalance: 0,
  totalWithdrawn: 0,
  pendingWithdrawals: 0,
};

export const useEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>(empty);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [method, setMethod] = useState<PayoutMethod | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: rentals }, { data: completedWithdrawals }, { data: profile }, { data: walletData }] = await Promise.all([
        supabase
          .from("rentals")
          .select(
            "id, public_id, owner_payout, subtotal, platform_fee, payment_status, status, created_at, start_date, end_date, product_id, renter_id, is_test_payment, handover_confirmed_at, products:product_id(title, images)"
          )
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("iban, account_holder_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("get_user_wallet_balance", { _user_id: user.id }),
      ]);

      const p = profile as ProfilePayoutRow | null;
      if (p?.iban) setMethod({ iban: p.iban, accountHolder: p.account_holder_name || "" });
      else setMethod(null);

      const withdrawalRows = (completedWithdrawals || []) as unknown as WithdrawalRequestRecord[];
      const wlist: WithdrawalRow[] = withdrawalRows.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        iban: w.iban,
        account_holder: w.account_holder,
        status: w.status,
        created_at: w.created_at,
        processed_at: w.processed_at,
        admin_note: w.admin_note,
      }));
      setWithdrawals(wlist);

      const totalWithdrawn = wlist
        .filter((w) => w.status === "completed" || w.status === "approved")
        .reduce((s, w) => s + w.amount, 0);
      const pendingWithdrawals = wlist
        .filter((w) => w.status === "pending")
        .reduce((s, w) => s + w.amount, 0);

      const rentalRows = (rentals || []) as unknown as RentalRecord[];
      const list = rentalRows.filter(
        (r) =>
          ["authorized", "paid", "captured"].includes(r.payment_status) &&
          r.is_test_payment !== true
      );

      const renterIds = [...new Set(list.map((r) => r.renter_id).filter((id): id is string => !!id))];
      const renterMap = new Map<string, { name: string | null; avatar: string | null }>();
      if (renterIds.length > 0) {
        const { data: renters } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", renterIds);
        ((renters || []) as RenterProfileRow[]).forEach((p) =>
          renterMap.set(p.id, { name: p.full_name || null, avatar: p.avatar_url || null })
        );
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      let totalAllTime = 0;
      let totalThisMonth = 0;
      const txns: EarningsTransaction[] = [];

      for (const r of list) {
        const payout = Number(r.owner_payout) || 0;
        // Only completed rentals count toward total/this-month earnings;
        // in-progress rentals (PV signed) are tracked separately as "held".
        if (r.status === "completed") {
          totalAllTime += payout;
          if (new Date(r.created_at) >= monthStart) totalThisMonth += payout;
        }

        let status: TxStatus = "pending";
        if (r.status === "cancelled") status = "cancelled";
        else if (r.status === "completed") status = "available";
        else if (r.handover_confirmed_at) status = "held";

        txns.push({
          id: r.id,
          rentalPublicId: r.public_id,
          productId: r.product_id,
          productTitle: r.products?.title || "Produs",
          productImage: r.products?.images?.[0] || null,
          renterId: r.renter_id,
          renterName: renterMap.get(r.renter_id)?.name ?? null,
          renterAvatar: renterMap.get(r.renter_id)?.avatar ?? null,
          startDate: r.start_date,
          endDate: r.end_date,
          subtotal: Number(r.subtotal) || 0,
          platformFee: Number(r.platform_fee) || 0,
          ownerPayout: payout,
          paymentStatus: r.payment_status,
          rentalStatus: r.status,
          date: r.created_at,
          status,
        });
      }

      const walletRows = walletData as unknown as WalletRpcRow | WalletRpcRow[] | null;
      const walletRow = Array.isArray(walletRows) ? walletRows[0] : walletRows;
      const walletAvailable = Number(walletRow?.available ?? totalAllTime - totalWithdrawn - pendingWithdrawals);
      const walletTotalEarnings = Number(walletRow?.total_earnings ?? totalAllTime);
      const walletPendingEarnings = Number(walletRow?.pending_earnings ?? 0);
      const walletTotalWithdrawn = Number(walletRow?.total_withdrawn ?? totalWithdrawn);
      const walletPendingWithdrawals = Number(walletRow?.pending_withdrawals ?? pendingWithdrawals);

      setEarnings({
        totalThisMonth: Math.round(totalThisMonth * 100) / 100,
        totalAllTime: Math.round(walletTotalEarnings * 100) / 100,
        pendingEarnings: Math.round(walletPendingEarnings * 100) / 100,
        totalRentals: list.length,
        availableBalance: Math.max(0, Math.round(walletAvailable * 100) / 100),
        withdrawableBalance: Math.max(0, Math.round(Number(walletRow?.withdrawable ?? walletAvailable) * 100) / 100),
        totalWithdrawn: Math.round(walletTotalWithdrawn * 100) / 100,
        pendingWithdrawals: Math.round(walletPendingWithdrawals * 100) / 100,
      });
      setTransactions(txns);
    } catch (e) {
      console.error("useEarnings:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: refresh on withdrawal/rental changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`earnings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawal_requests", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `owner_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_ledger", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchData]);

  return { loading, earnings, transactions, withdrawals, method, refresh: fetchData };
};