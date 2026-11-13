import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, Inbox, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

type Range = "7d" | "30d" | "90d";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "hsl(var(--destructive))",
  HIGH: "#F97316",
  MEDIUM: "hsl(var(--primary))",
  LOW: "#6B7280",
};

const CATEGORY_COLORS = ["hsl(var(--primary))", "#3B82F6", "#22C55E", "#F97316", "#8B5CF6", "#EC4899", "#6B7280"];

interface AnalyticsData {
  totals: {
    total: number;
    new_count: number;
    in_progress_count: number;
    waiting_count: number;
    resolved_count: number;
    closed_count: number;
    unassigned_count: number;
  };
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  avg_first_response_minutes: number | null;
  avg_resolution_hours: number | null;
  sla_breach_count: number;
  daily: Array<{ day: string; created: number; resolved: number }>;
  by_admin: Array<{ admin_id: string; name: string; open: number; resolved: number; total: number }>;
}

const AdminSupportAnalytics = () => {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - days);
    return { from: f.toISOString(), to: t.toISOString() };
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: result, error } = await supabase.rpc("get_support_analytics" as any, {
        p_from: from,
        p_to: to,
      });
      if (cancelled) return;
      if (!error && result) setData(result as unknown as AnalyticsData);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [from, to]);

  const priorityData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.by_priority).map(([name, value]) => ({ name, value }));
  }, [data]);

  const categoryData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.by_category).map(([name, value]) => ({ name, value }));
  }, [data]);

  const formatMinutes = (m: number | null) => {
    if (m == null) return "—";
    if (m < 60) return `${Math.round(m)} min`;
    return `${(m / 60).toFixed(1)} h`;
  };

  const formatHours = (h: number | null) => {
    if (h == null) return "—";
    if (h < 24) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} zile`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Analytics Suport</h1>
            <p className="text-sm text-muted-foreground">
              Performanță echipă, SLA și volume tichete
            </p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r)}
              >
                {r === "7d" ? "7 zile" : r === "30d" ? "30 zile" : "90 zile"}
              </Button>
            ))}
          </div>
        </div>

        {loading || !data ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard icon={Inbox} label="Total tichete" value={data.totals.total} />
              <KpiCard icon={TrendingUp} label="În lucru" value={data.totals.in_progress_count + data.totals.waiting_count} />
              <KpiCard icon={CheckCircle2} label="Rezolvate" value={data.totals.resolved_count + data.totals.closed_count} accent="text-green-600" />
              <KpiCard icon={AlertTriangle} label="Breach SLA" value={data.sla_breach_count} accent="text-destructive" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard icon={Clock} label="Răspuns mediu" value={formatMinutes(data.avg_first_response_minutes)} />
              <KpiCard icon={CheckCircle2} label="Timp rezolvare" value={formatHours(data.avg_resolution_hours)} />
              <KpiCard icon={AlertTriangle} label="Neasignate" value={data.totals.unassigned_count} />
              <KpiCard icon={Users} label="Admini activi" value={data.by_admin.length} />
            </div>

            {/* Trend chart */}
            <Card>
              <CardHeader>
                <CardTitle>Volum zilnic</CardTitle>
                <CardDescription>Tichete create vs rezolvate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={(d) => new Date(d as string).toLocaleDateString("ro-RO")} />
                    <Legend />
                    <Line type="monotone" dataKey="created" name="Create" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved" name="Rezolvate" stroke="#22C55E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuție pe prioritate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {priorityData.map((entry) => (
                          <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || "#6B7280"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Top categorii</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Tichete">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Per admin */}
            <Card>
              <CardHeader>
                <CardTitle>Performanță echipă</CardTitle>
                <CardDescription>Tichete asignate per admin</CardDescription>
              </CardHeader>
              <CardContent>
                {data.by_admin.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nicio activitate în interval.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground border-b">
                        <tr>
                          <th className="py-2">Admin</th>
                          <th className="py-2 text-right">Deschise</th>
                          <th className="py-2 text-right">Rezolvate</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Rată rezolvare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.by_admin.map((a) => {
                          const rate = a.total > 0 ? Math.round((a.resolved / a.total) * 100) : 0;
                          return (
                            <tr key={a.admin_id} className="border-b last:border-0">
                              <td className="py-2 font-medium">{a.name}</td>
                              <td className="py-2 text-right">{a.open}</td>
                              <td className="py-2 text-right text-green-600">{a.resolved}</td>
                              <td className="py-2 text-right">{a.total}</td>
                              <td className="py-2 text-right">{rate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminSupportAnalytics;