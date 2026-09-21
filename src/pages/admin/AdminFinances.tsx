import { useState } from "react";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, CheckCircle2, AlertTriangle, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { useFinancialSummary, useAdminRentals } from "@/hooks/queries/useAdminStats";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Transaction {
  id: string;
  rental_id: string | null;
  user_id: string | null;
  amount: number;
  type: string;
  status: string;
  currency: string | null;
  description: string | null;
  created_at: string;
  processed_at: string | null;
}

const TxExpandedPanel = ({
  tx, updatingTx, onUpdateStatus, formatCurrency,
}: {
  tx: Transaction; updatingTx: string | null; onUpdateStatus: (id: string, status: string) => void; formatCurrency: (v: number) => string;
}) => (
  <div className="p-4 space-y-3 bg-muted/30 border-t">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div>
        <span className="text-muted-foreground">Descriere:</span>
        <p className="font-medium">{tx.description || '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Data:</span>
        <p className="font-medium">{format(new Date(tx.created_at), 'd MMM yyyy HH:mm', { locale: ro })}</p>
      </div>
    </div>
    <Separator />
    {updatingTx === tx.id ? (
      <span className="text-xs text-muted-foreground">Se actualizează...</span>
    ) : (
      <div className="flex flex-wrap gap-2">
        {tx.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(tx.id, 'verified')}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Verificat
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => onUpdateStatus(tx.id, 'suspicious')}>
              <AlertTriangle className="h-3 w-3 mr-1" /> Suspect
            </Button>
          </>
        )}
        {(tx.status === 'completed' || tx.status === 'verified') && (
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(tx.id, 'refunded')}>Rambursează</Button>
        )}
      </div>
    )}
  </div>
);

const txStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  verified: "bg-blue-100 text-blue-800",
  suspicious: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

const AdminFinances = () => {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  const [txStatusFilter, setTxStatusFilter] = useState<string>("all");
  const [updatingTx, setUpdatingTx] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(startDate, endDate);
  const { data: recentRentals, isLoading: rentalsLoading } = useAdminRentals(undefined, 10);

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['adminTransactions', txStatusFilter],
    queryFn: async () => {
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50);
      if (txStatusFilter !== 'all') query = query.eq('status', txStatusFilter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
    staleTime: 30000,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 0 }).format(value);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subMonths(now, 6 - i);
    return {
      name: format(date, 'MMM', { locale: ro }),
      venituri: Math.floor(Math.random() * 10000) + 1000,
      comisioane: Math.floor(Math.random() * 2000) + 200,
    };
  });

  const handleUpdateTxStatus = async (txId: string, status: string) => {
    setUpdatingTx(txId);
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') updates.processed_at = new Date().toISOString();
      const { error } = await supabase.from('transactions').update(updates as never).eq('id', txId);
      if (error) throw error;
      toast.success(`Tranzacție marcată ca "${status}"`);
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
    } catch { toast.error("Eroare la actualizare"); }
    finally { setUpdatingTx(null); }
  };

  const exportCSV = () => {
    if (!transactions?.length) return;
    const headers = ['ID', 'Tip', 'Sumă', 'Monedă', 'Status', 'Descriere', 'Data'];
    const rows = transactions.map(tx => [
      tx.id, tx.type, tx.amount, tx.currency || 'RON', tx.status, tx.description || '', format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tranzactii-${format(now, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => setExpandedTxId(prev => prev === id ? null : id);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Rapoarte Financiare</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">— Monitorizează veniturile și tranzacțiile</span>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatsCard title="Venituri Totale" value={formatCurrency(financialSummary?.total_revenue || 0)} icon={<TrendingUp className="h-4 w-4" />} description="Luna curentă" />
              <StatsCard title="Comisioane" value={formatCurrency(financialSummary?.platform_fees || 0)} icon={<ArrowUpRight className="h-4 w-4" />} description={feeShareLabel} />
              <StatsCard title="Plăți Proprietari" value={formatCurrency(financialSummary?.owner_payouts || 0)} icon={<ArrowDownRight className="h-4 w-4" />} description={payoutShareLabel} />
              <StatsCard title="Plăți Așteptare" value={formatCurrency(financialSummary?.pending_payments || 0)} icon={<Calendar className="h-4 w-4" />} description={`${financialSummary?.completed_rentals || 0} finalizate`} />
            </>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
            <TabsTrigger value="payments">Verificare Plăți</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Evoluția Veniturilor</CardTitle>
                <CardDescription>Ultimele 7 luni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="venituri" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Venituri totale" />
                      <Area type="monotone" dataKey="comisioane" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} name="Comisioane" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tranzacții Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {rentalsLoading ? (
                  <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : recentRentals && recentRentals.length > 0 ? (
                  <div className="space-y-3">
                    {recentRentals.map((rental) => (
                      <div key={rental.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="font-mono text-[10px] text-primary font-semibold">{rental.public_id}</p>
                          <p className="font-medium text-sm truncate">{rental.product_title}</p>
                          <p className="text-xs text-muted-foreground">{rental.renter_name} • {format(new Date(rental.created_at), 'd MMM yyyy', { locale: ro })}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-medium text-sm">{formatCurrency(rental.subtotal)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Comision</p>
                            <p className="font-medium text-sm text-primary">{formatCurrency(rental.platform_fee)}</p>
                          </div>
                          {(() => {
                            const isPaid = rental.payment_status === 'paid' || rental.payment_status === 'captured';
                            return (
                              <Badge className={`text-[10px] ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isPaid ? 'Plătit' : 'Neplătit'}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nu există tranzacții încă</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg">Verificare Plăți</CardTitle>
                  <div className="flex gap-2">
                    <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
                      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="pending">În așteptare</SelectItem>
                        <SelectItem value="completed">Completate</SelectItem>
                        <SelectItem value="verified">Verificate</SelectItem>
                        <SelectItem value="suspicious">Suspecte</SelectItem>
                        <SelectItem value="refunded">Rambursate</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={exportCSV} disabled={!transactions?.length}>
                      <Download className="h-4 w-4 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : transactions && transactions.length > 0 ? (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tip</TableHead>
                            <TableHead>Sumă</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Descriere</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
                            <>
                              <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(tx.id)}>
                                <TableCell className="capitalize">{tx.type}</TableCell>
                                <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                                <TableCell>
                                  <Badge className={txStatusColors[tx.status] || "bg-gray-100 text-gray-800"}>{tx.status}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                  {format(new Date(tx.created_at), 'd MMM yyyy', { locale: ro })}
                                </TableCell>
                              </TableRow>
                              {expandedTxId === tx.id && (
                                <TableRow key={`${tx.id}-expand`}>
                                  <TableCell colSpan={5} className="p-0">
                                    <TxExpandedPanel tx={tx} updatingTx={updatingTx} onUpdateStatus={handleUpdateTxStatus} formatCurrency={formatCurrency} />
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {transactions.map((tx) => (
                        <Card key={tx.id} className="overflow-hidden">
                          <div className="p-3 cursor-pointer flex items-center justify-between" onClick={() => toggleExpand(tx.id)}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium capitalize">{tx.type}</p>
                              <p className="text-xs text-muted-foreground truncate">{tx.description || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-medium">{formatCurrency(tx.amount)}</span>
                              <Badge className={`${txStatusColors[tx.status] || "bg-gray-100"} text-[10px]`}>{tx.status}</Badge>
                              {expandedTxId === tx.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          {expandedTxId === tx.id && (
                            <TxExpandedPanel tx={tx} updatingTx={updatingTx} onUpdateStatus={handleUpdateTxStatus} formatCurrency={formatCurrency} />
                          )}
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nu există tranzacții</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFinances;
