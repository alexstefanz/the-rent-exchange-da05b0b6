import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AccountDashboardData {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
    iban: string | null;
    account_holder_name: string | null;
    created_at: string | null;
    account_type: string;
  } | null;
  health: {
    items: { key: string; labelRo: string; labelEn: string; done: boolean; href: string }[];
    completion: number; // 0-100
  };
  trust: {
    rating: number;
    reviewsCount: number;
    completedRentals: number;
    memberSince: string | null;
    verified: boolean;
  };
  signals: {
    activeRentalsAsOwner: number;
    activeRentalsAsRenter: number;
    actionableHandover: number; // confirmed but not picked up where user is owner
    pendingReturns: number; // active rentals to confirm return as owner
    unreadMessages: number;
    availableBalance: number;
    monthlyEarnings: number;
    totalCompletedRentals: number;
    completedRentalsAsOwner: number;
    newReviews: number;
    ibanMissing: boolean;
  };
  notifications: {
    unread: number;
    grouped: { type: string; count: number; latest: string | null }[];
  };
  activity: {
    id: string;
    type: string;
    title: string;
    created_at: string;
    link: string | null;
  }[];
}

export function useAccountDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["accountDashboard", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AccountDashboardData> => {
      const uid = userId!;

      const [
        { data: profile },
        { data: rentalsAsOwner },
        { data: rentalsAsRenter },
        { data: reviews },
        { data: convs },
        { data: notifs },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, avatar_url, phone, iban, account_holder_name, created_at, account_type, identity_status"
          )
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("rentals")
          .select("id, status, payment_status, owner_payout, end_date, created_at, return_confirmed_at, handover_confirmed_at")
          .eq("owner_id", uid),
        supabase
          .from("rentals")
          .select("id, status, end_date")
          .eq("renter_id", uid),
        supabase
          .from("user_reviews")
          .select("id, rating, created_at")
          .eq("reviewed_user_id", uid),
        supabase
          .from("conversations")
          .select("id")
          .or(`buyer_id.eq.${uid},owner_id.eq.${uid}`),
        supabase
          .from("notifications")
          .select("id, type, title_ro, title_en, link, is_read, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      // unread messages
      let unreadMessages = 0;
      const convoIds = (convs || []).map((c: any) => c.id);
      if (convoIds.length) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convoIds)
          .neq("sender_id", uid)
          .eq("is_read", false);
        unreadMessages = count || 0;
      }

      // Available balance — single source of truth via RPC. Includes
      // earnings from paid/captured/authorized rentals minus withdrawals
      // plus wallet_ledger net (so wallet-paid rentals credit the owner
      // and debit the renter immediately, without needing rows in `transactions`).
      const { data: walletData } = await supabase.rpc(
        "get_user_wallet_balance" as any,
        { _user_id: uid }
      );
      const walletRow: any = Array.isArray(walletData) ? walletData[0] : walletData;
      const availableBalance = Number(walletRow?.available ?? 0);

      // Monthly earnings: paid/captured/authorized rentals as owner in current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      let monthlyEarnings = 0;
      for (const r of (rentalsAsOwner || []) as any[]) {
        if (
          ["paid", "captured", "authorized"].includes(r.payment_status) &&
          r.created_at &&
          new Date(r.created_at) >= startOfMonth
        ) {
          monthlyEarnings += Number(r.owner_payout || 0);
        }
      }

      // signals
      const ownerActive = (rentalsAsOwner || []).filter((r: any) =>
        ["confirmed", "active"].includes(r.status)
      );
      const renterActive = (rentalsAsRenter || []).filter((r: any) =>
        ["confirmed", "active"].includes(r.status)
      );
      const pendingReturns = (rentalsAsOwner || []).filter(
        (r: any) => r.status === "active" && !r.return_confirmed_at
      ).length;
      const actionableHandover = (rentalsAsOwner || []).filter(
        (r: any) => r.status === "confirmed" && !r.handover_confirmed_at
      ).length;
      const completedRentalsAsOwner = (rentalsAsOwner || []).filter(
        (r: any) => r.status === "completed"
      ).length;
      const completedRentalsAsRenter = (rentalsAsRenter || []).filter(
        (r: any) => r.status === "completed"
      ).length;
      const completedRentals = completedRentalsAsOwner + completedRentalsAsRenter;

      // reviews
      const reviewsArr = reviews || [];
      const ratingAvg =
        reviewsArr.length > 0
          ? reviewsArr.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviewsArr.length
          : 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newReviews = reviewsArr.filter((r: any) => new Date(r.created_at) >= sevenDaysAgo).length;

      // health
      const p: any = profile || {};
      const items = [
        { key: "identity", labelRo: "Identitate verificată (Stripe)", labelEn: "Identity verified (Stripe)", done: p.identity_status === "verified", href: "/verificare" },
        { key: "name", labelRo: "Nume complet", labelEn: "Full name", done: !!p.full_name, href: "/contul-meu?focus=name" },
        { key: "phone", labelRo: "Telefon valid", labelEn: "Valid phone", done: !!p.phone, href: "/contul-meu?focus=phone" },
        { key: "avatar", labelRo: "Fotografie profil", labelEn: "Profile photo", done: !!p.avatar_url, href: "/contul-meu?focus=avatar" },
        { key: "iban", labelRo: "IBAN pentru încasări (nu cardul)", labelEn: "Payout IBAN (not your card)", done: !!p.iban, href: "/contul-meu?focus=iban" },
      ];
      const completion = Math.round((items.filter((i) => i.done).length / items.length) * 100);

      // notifications
      const notifList = notifs || [];
      const unreadNotifs = notifList.filter((n: any) => !n.is_read);
      const grouped: Record<string, { count: number; latest: string | null }> = {};
      for (const n of unreadNotifs as any[]) {
        if (!grouped[n.type]) grouped[n.type] = { count: 0, latest: null };
        grouped[n.type].count += 1;
        if (!grouped[n.type].latest || new Date(n.created_at) > new Date(grouped[n.type].latest!)) {
          grouped[n.type].latest = n.created_at;
        }
      }

      const memberSince = p.created_at || null;

      return {
        profile: profile as any,
        health: { items, completion },
        trust: {
          rating: Math.round(ratingAvg * 10) / 10,
          reviewsCount: reviewsArr.length,
          completedRentals,
          memberSince,
          verified: p.identity_status === "verified",
        },
        signals: {
          activeRentalsAsOwner: ownerActive.length,
          activeRentalsAsRenter: renterActive.length,
          actionableHandover,
          pendingReturns,
          unreadMessages,
          availableBalance,
          monthlyEarnings,
          totalCompletedRentals: completedRentals,
          completedRentalsAsOwner,
          newReviews,
          ibanMissing: !p.iban,
        },
        notifications: {
          unread: unreadNotifs.length,
          grouped: Object.entries(grouped).map(([type, v]) => ({
            type,
            count: v.count,
            latest: v.latest,
          })),
        },
        activity: notifList.slice(0, 8).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title_ro || n.title_en || "",
          created_at: n.created_at,
          link: n.link,
        })),
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Refetch after password reset / token refresh so a stale empty profile isn't cached
  useEffect(() => {
    if (!userId) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "USER_UPDATED" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ["accountDashboard", userId] });
        }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [userId, qc]);

  // realtime
  useEffect(() => {
    if (!userId) return;
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["accountDashboard", userId] });
      qc.invalidateQueries({ queryKey: ["walletBalance", userId] });
    };
    const ch = supabase
      .channel(`account-dashboard-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals", filter: `owner_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals", filter: `renter_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawal_requests", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_ledger", filter: `user_id=eq.${userId}` }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  return query;
}