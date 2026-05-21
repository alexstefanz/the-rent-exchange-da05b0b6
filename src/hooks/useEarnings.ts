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
  totalRentals: number;
  availableBalance: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
}

export interface PayoutMethod {
  iban: string;
  accountHolder: string;
}

const empty: EarningsData = {
  totalThisMonth: 0,
  totalAllTime: 0,
  totalRentals: 0,
  availableBalance: 0,
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
            "id, public_id, owner_payout, subtotal, platform_fee, payment_status, status, created_at, start_date, end_date, product_id, renter_id, is_test_payment, products:product_id(title, images)"
          )
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawal_requests" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("iban, account_holder_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("get_user_wallet_balance" as any, { _user_id: user.id }),
      ]);

      const p: any = profile;
      if (p?.iban) setMethod({ iban: p.iban, accountHolder: p.account_holder_name || "" });
      else setMethod(null);

      const wlist: WithdrawalRow[] = ((completedWithdrawals || []) as any[]).map((w) => ({
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

      const list = (rentals || []).filter(
        (r: any) =>
          ["authorized", "paid", "captured"].includes(r.payment_status) &&
          r.is_test_payment !== true
      );

      const renterIds = [...new Set((list as any[]).map((r) => r.renter_id).filter(Boolean))];
      const renterMap = new Map<string, { name: string | null; avatar: string | null }>();
      if (renterIds.length > 0) {
        const { data: renters } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", renterIds);
        (renters || []).forEach((p: any) =>
          renterMap.set(p.id, { name: p.full_name || null, avatar: p.avatar_url || null })
        );
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      let totalAllTime = 0;
      let totalThisMonth = 0;
      const txns: EarningsTransaction[] = [];

      for (const r of list as any[]) {
        const payout = Number(r.owner_payout) || 0;
        totalAllTime += payout;
        if (new Date(r.created_at) >= monthStart) totalThisMonth += payout;

        let status: TxStatus = "available";
        if (r.status === "cancelled") status = "cancelled";

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

      const walletRow: any = Array.isArray(walletData) ? walletData[0] : walletData;
      const walletAvailable = Number(walletRow?.available ?? totalAllTime - totalWithdrawn - pendingWithdrawals);
      const walletTotalEarnings = Number(walletRow?.total_earnings ?? totalAllTime);
      const walletTotalWithdrawn = Number(walletRow?.total_withdrawn ?? totalWithdrawn);
      const walletPendingWithdrawals = Number(walletRow?.pending_withdrawals ?? pendingWithdrawals);

      setEarnings({
        totalThisMonth: Math.round(totalThisMonth * 100) / 100,
        totalAllTime: Math.round(walletTotalEarnings * 100) / 100,
        totalRentals: list.length,
        availableBalance: Math.max(0, Math.round(walletAvailable * 100) / 100),
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