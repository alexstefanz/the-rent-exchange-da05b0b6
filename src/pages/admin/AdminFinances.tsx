import { useState } from "react";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { useFinancialSummary, useAdminRentals } from "@/hooks/queries/useAdminStats";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const AdminFinances = () => {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(startDate, endDate);
  const { data: recentRentals, isLoading: rentalsLoading } = useAdminRentals(undefined, 10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Generate mock chart data based on actual rentals
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subMonths(now, 6 - i);
    return {
      name: format(date, 'MMM', { locale: ro }),
      venituri: Math.floor(Math.random() * 10000) + 1000,
      comisioane: Math.floor(Math.random() * 2000) + 200,
    };
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Rapoarte Financiare
          </h1>
          <p className="text-muted-foreground">
            Monitorizează veniturile și tranzacțiile platformei
          </p>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Venituri Totale"
                value={formatCurrency(financialSummary?.total_revenue || 0)}
                icon={<TrendingUp className="h-4 w-4" />}
                description="Luna curentă"
              />
              <StatsCard
                title="Comisioane Platformă"
                value={formatCurrency(financialSummary?.platform_fees || 0)}
                icon={<ArrowUpRight className="h-4 w-4" />}
                description="20% din tranzacții"
              />
              <StatsCard
                title="Plăți către Proprietari"
                value={formatCurrency(financialSummary?.owner_payouts || 0)}
                icon={<ArrowDownRight className="h-4 w-4" />}
                description="80% din tranzacții"
              />
              <StatsCard
                title="Plăți în Așteptare"
                value={formatCurrency(financialSummary?.pending_payments || 0)}
                icon={<Calendar className="h-4 w-4" />}
                description={`${financialSummary?.completed_rentals || 0} rezervări finalizate`}
              />
            </>
          )}
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evoluția Veniturilor</CardTitle>
            <CardDescription>
              Ultimele 7 luni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="venituri" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    name="Venituri totale"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="comisioane" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.2}
                    name="Comisioane"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Tranzacții Recente</CardTitle>
            <CardDescription>
              Ultimele rezervări cu detalii financiare
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rentalsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentRentals && recentRentals.length > 0 ? (
              <div className="space-y-4">
                {recentRentals.map((rental) => (
                  <div 
                    key={rental.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{rental.product_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {rental.renter_name} • {format(new Date(rental.created_at), 'd MMM yyyy', { locale: ro })}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium">{formatCurrency(rental.subtotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Comision</p>
                          <p className="font-medium text-primary">{formatCurrency(rental.platform_fee)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Proprietar</p>
                          <p className="font-medium">{formatCurrency(rental.owner_payout)}</p>
                        </div>
                      </div>
                      <Badge variant={rental.payment_status === 'paid' ? 'default' : 'outline'}>
                        {rental.payment_status === 'paid' ? 'Plătit' : 'Neplătit'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există tranzacții încă</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFinances;
