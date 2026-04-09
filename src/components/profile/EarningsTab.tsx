import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  Loader2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface EarningsData {
  totalThisMonth: number;
  totalAllTime: number;
  pendingPayout: number;
  totalRentals: number;
}

interface Transaction {
  id: string;
  productTitle: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "processing";
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
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        // Fetch rentals where user is owner
        const { data: rentals } = await supabase
          .from("rentals")
          .select("id, owner_payout, payment_status, created_at, product_id, products:product_id(title)")
          .eq("owner_id", user.id)
          .in("payment_status", ["authorized", "paid", "captured"])
          .order("created_at", { ascending: false });

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

          setEarnings({
            totalThisMonth: Math.round(totalThisMonth * 100) / 100,
            totalAllTime: Math.round(totalAllTime * 100) / 100,
            pendingPayout: Math.round(pendingPayout * 100) / 100,
            totalRentals: rentals.length,
          });
          setTransactions(txns);
        }
      } catch (e) {
        console.error("Error fetching earnings:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {t("Total câștiguri", "Total earnings")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings.totalAllTime.toFixed(2)} RON
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
              {t("Total închirieri", "Total rentals")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.totalRentals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("Istoric tranzacții", "Transaction history")}
          </CardTitle>
          <CardDescription>
            {t(
              "Toate tranzacțiile din contul tău",
              "All transactions from your account"
            )}
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
                    <th scope="col" className="px-4 py-3">
                      {t("Produs", "Product")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("Sumă", "Amount")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("Data", "Date")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("Status", "Status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="px-4 py-4 font-medium">
                        {transaction.productTitle}
                      </td>
                      <td className="px-4 py-4">
                        {transaction.amount.toFixed(2)} RON
                      </td>
                      <td className="px-4 py-4">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
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
    </div>
  );
};

export default EarningsTab;
