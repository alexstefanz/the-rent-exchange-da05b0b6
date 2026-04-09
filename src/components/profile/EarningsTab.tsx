import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  Loader2,
  ArrowUpRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WithdrawalDialog from "./WithdrawalDialog";

interface EarningsData {
  totalThisMonth: number;
  totalAllTime: number;
  pendingPayout: number;
  totalRentals: number;
  availableBalance: number;
}

interface Transaction {
  id: string;
  productTitle: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "processing";
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  iban: string;
  status: string;
  created_at: string;
  admin_note: string | null;
}

const EarningsTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalThisMonth: 0,
    totalAllTime: 0,
    pendingPayout: 0,
    totalRentals: 0,
    availableBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [profileIban, setProfileIban] = useState("");
  const [profileAccountHolder, setProfileAccountHolder] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch rentals where user is owner
      const { data: rentals } = await supabase
        .from("rentals")
        .select("id, owner_payout, payment_status, created_at, product_id, products:product_id(title)")
        .eq("owner_id", user.id)
        .in("payment_status", ["authorized", "paid", "captured"])
        .order("created_at", { ascending: false });

      // Fetch completed withdrawals
      const { data: completedWithdrawals } = await supabase
        .from("withdrawal_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch profile for IBAN
      const { data: profile } = await supabase
        .from("profiles")
        .select("iban, account_holder_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setProfileIban((profile as any).iban || "");
        setProfileAccountHolder((profile as any).account_holder_name || "");
      }

      const withdrawalsList = ((completedWithdrawals || []) as any[]).map((w: any) => ({
        id: w.id,
        amount: Number(w.amount),
        iban: w.iban,
        status: w.status,
        created_at: w.created_at,
        admin_note: w.admin_note,
      }));
      setWithdrawals(withdrawalsList);

      const totalWithdrawn = withdrawalsList
        .filter((w) => w.status === "completed" || w.status === "approved")
        .reduce((sum, w) => sum + w.amount, 0);

      const pendingWithdrawals = withdrawalsList
        .filter((w) => w.status === "pending")
        .reduce((sum, w) => sum + w.amount, 0);

      if (rentals) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalAllTime = 0;
        let totalThisMonth = 0;
        let pendingPayout = 0;
        const txns: Transaction[] = [];

        for (const r of rentals) {
          const payout = Number(r.owner_payout) || 0;
          totalAllTime += payout;

          if (new Date(r.created_at) >= monthStart) {
            totalThisMonth += payout;
          }

          if (r.payment_status === "authorized") {
            pendingPayout += payout;
          }

          let status: "completed" | "pending" | "processing" = "pending";
          if (r.payment_status === "captured" || r.payment_status === "paid") {
            status = "completed";
          } else if (r.payment_status === "authorized") {
            status = "processing";
          }

          txns.push({
            id: r.id,
            productTitle: (r.products as any)?.title || "Produs",
            amount: payout,
            date: r.created_at,
            status,
          });
        }

        const availableBalance = Math.max(0, Math.round((totalAllTime - pendingPayout - totalWithdrawn - pendingWithdrawals) * 100) / 100);

        setEarnings({
          totalThisMonth: Math.round(totalThisMonth * 100) / 100,
          totalAllTime: Math.round(totalAllTime * 100) / 100,
          pendingPayout: Math.round(pendingPayout * 100) / 100,
          totalRentals: rentals.length,
          availableBalance,
        });
        setTransactions(txns);
      }
    } catch (e) {
      console.error("Error fetching earnings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const withdrawalStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: t("În așteptare", "Pending"), className: "bg-yellow-100 text-yellow-800" },
      approved: { label: t("Aprobat", "Approved"), className: "bg-blue-100 text-blue-800" },
      completed: { label: t("Finalizat", "Completed"), className: "bg-green-100 text-green-800" },
      rejected: { label: t("Respins", "Rejected"), className: "bg-red-100 text-red-800" },
    };
    const s = map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Balanță disponibilă", "Available balance")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {earnings.availableBalance.toFixed(2)} RON
            </div>
            <Button
              size="sm"
              className="mt-2 w-full"
              disabled={earnings.availableBalance <= 0}
              onClick={() => setShowWithdrawDialog(true)}
            >
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {t("Retrage", "Withdraw")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Câștiguri luna aceasta", "Earnings this month")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings.totalThisMonth.toFixed(2)} RON
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("În așteptare", "Pending")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {earnings.pendingPayout.toFixed(2)} RON
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Blocat până la finalizarea închirierii", "Held until rental ends")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Total câștiguri", "Total earnings")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.totalAllTime.toFixed(2)} RON</div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              {t("Cererile tale de retragere", "Your withdrawal requests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">{t("Sumă", "Amount")}</th>
                    <th className="px-4 py-3">IBAN</th>
                    <th className="px-4 py-3">{t("Data", "Date")}</th>
                    <th className="px-4 py-3">{t("Status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b">
                      <td className="px-4 py-4 font-medium">{w.amount.toFixed(2)} RON</td>
                      <td className="px-4 py-4 font-mono text-xs">{w.iban}</td>
                      <td className="px-4 py-4">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        {withdrawalStatusBadge(w.status)}
                        {w.admin_note && w.status === "rejected" && (
                          <p className="text-xs text-muted-foreground mt-1">{w.admin_note}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("Istoric tranzacții", "Transaction history")}
          </CardTitle>
          <CardDescription>
            {t("Toate tranzacțiile din contul tău", "All transactions from your account")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("Nicio tranzacție", "No transactions")}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {t(
                  "Nu ai încă nicio tranzacție. Când cineva va închiria un produs de la tine, tranzacția va apărea aici.",
                  "You don't have any transactions yet. When someone rents a product from you, the transaction will appear here."
                )}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">{t("Produs", "Product")}</th>
                    <th scope="col" className="px-4 py-3">{t("Sumă", "Amount")}</th>
                    <th scope="col" className="px-4 py-3">{t("Data", "Date")}</th>
                    <th scope="col" className="px-4 py-3">{t("Status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="px-4 py-4 font-medium">{transaction.productTitle}</td>
                      <td className="px-4 py-4">{transaction.amount.toFixed(2)} RON</td>
                      <td className="px-4 py-4">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {transaction.status === "completed"
                            ? t("Disponibil", "Available")
                            : transaction.status === "pending"
                            ? t("În așteptare", "Pending")
                            : t("Blocat", "Held")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <WithdrawalDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        availableBalance={earnings.availableBalance}
        defaultIban={profileIban}
        defaultAccountHolder={profileAccountHolder}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default EarningsTab;
