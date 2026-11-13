import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, parseISO, startOfMonth, subMonths, isWithinInterval } from "date-fns";
import { Building2, Package, CalendarDays, FileText, Download, Loader2, TrendingUp, Wallet, Percent, Activity } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE = ["confirmed", "active", "in_progress", "handed_over", "return_pending"];
const DONE = ["completed", "finalized"];
const ron = (n: number) => `${n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`;

type Rental = {
  id: string; public_id: string; product_id: string | null; start_date: string; end_date: string;
  rental_days: number; subtotal: number; platform_fee: number; owner_payout: number; status: string;
  product_title_snapshot: string | null; created_at: string | null;
};

export default function BusinessDashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [docFilter, setDocFilter] = useState<"all" | "done">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["business-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [p, prod, r] = await Promise.all([
        supabase.from("profiles").select("account_type, company_name, cui, reg_com, company_address").eq("id", user!.id).maybeSingle(),
        supabase.from("products").select("id, title, images, daily_price_owner, approval_status, is_active, location_city, slug, blocked_dates").eq("owner_id", user!.id).is("deleted_at", null),
        supabase.from("rentals").select("id, public_id, product_id, start_date, end_date, rental_days, subtotal, platform_fee, owner_payout, status, product_title_snapshot, created_at").eq("owner_id", user!.id).order("start_date", { ascending: false }),
      ]);
      return { profile: p.data, products: prod.data ?? [], rentals: (r.data ?? []) as Rental[] };
    },
  });

  const stats = useMemo(() => {
    const rentals = data?.rentals ?? [];
    const products = data?.products ?? [];
    const done = rentals.filter((r) => DONE.includes(r.status));
    const active = rentals.filter((r) => ACTIVE.includes(r.status));
    const pending = rentals.filter((r) => r.status === "pending");
    const monthStart = startOfMonth(new Date());
    const revenue = done.reduce((s, r) => s + Number(r.owner_payout), 0);
    const monthRevenue = done.filter((r) => parseISO(r.end_date) >= monthStart).reduce((s, r) => s + Number(r.owner_payout), 0);
    const fees = done.reduce((s, r) => s + Number(r.platform_fee), 0);
    const today = new Date().toISOString().slice(0, 10);
    const rentedIds = new Set(active.filter((r) => r.start_date <= today && r.end_date >= today).map((r) => r.product_id));
    const last30 = addDays(new Date(), -30);
    const usedDays = [...active, ...done].reduce((s, r) => {
      let n = 0;
      for (let d = parseISO(r.start_date); d <= parseISO(r.end_date); d = addDays(d, 1)) if (d >= last30 && d <= new Date()) n++;
      return s + n;
    }, 0);
    const utilization = products.length ? Math.min(100, Math.round((usedDays / (products.length * 30)) * 100)) : 0;
    const months = Array.from({ length: 6 }, (_, i) => {
      const m = startOfMonth(subMonths(new Date(), 5 - i));
      const end = startOfMonth(subMonths(new Date(), 4 - i));
      const v = done.filter((r) => { const d = parseISO(r.end_date); return d >= m && d < end; }).reduce((s, r) => s + Number(r.owner_payout), 0);
      return { label: format(m, "MMM"), v };
    });
    return { revenue, monthRevenue, fees, active, pending, rentedIds, utilization, months, done };
  }, [data]);

  if (!loading && !user) return <Navigate to="/auth?redirect=/business" replace />;
  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (data?.profile?.account_type !== "business") return <Navigate to="/onboarding/business" replace />;

  const { profile, products, rentals } = data!;
  const max = Math.max(1, ...stats.months.map((m) => m.v));
  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const docs = rentals.filter((r) => docFilter === "all" ? r.status !== "pending" && r.status !== "cancelled" : DONE.includes(r.status));

  const exportCsv = () => {
    const rows = [["ID", "Produs", "Start", "Sfarsit", "Zile", "Subtotal", "Comision Rentli", "Net incasat", "Status"],
      ...rentals.map((r) => [r.public_id, r.product_title_snapshot ?? "", r.start_date, r.end_date, r.rental_days, r.subtotal, r.platform_fee, r.owner_payout, r.status])];
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `raport-rentli-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
  };

  const kpis = [
    { icon: TrendingUp, label: t("Venituri nete totale", "Total net revenue"), value: ron(stats.revenue) },
    { icon: Wallet, label: t("Venituri luna curentă", "This month"), value: ron(stats.monthRevenue) },
    { icon: Activity, label: t("Închirieri active", "Active rentals"), value: String(stats.active.length) },
    { icon: CalendarDays, label: t("Cereri noi", "New requests"), value: String(stats.pending.length) },
    { icon: Package, label: t("Echipamente în flotă", "Fleet size"), value: String(products.length) },
    { icon: Percent, label: t("Grad utilizare (30 zile)", "Utilization (30d)"), value: `${stats.utilization}%` },
    { icon: FileText, label: t("Comisioane Rentli", "Rentli fees"), value: ron(stats.fees) },
    { icon: Building2, label: t("Închirieri finalizate", "Completed"), value: String(stats.done.length) },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2"><Building2 className="h-3 w-3 mr-1" />Rentli Business</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{profile?.company_name || t("Compania mea", "My company")}</h1>
            <p className="text-sm text-muted-foreground">{profile?.cui && `CUI ${profile.cui}`}{profile?.reg_com && ` · ${profile.reg_com}`}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/inchirieri")}>{t("Închirieri", "Rentals")}</Button>
            <Button onClick={() => navigate("/owner/new-product")}>{t("Adaugă echipament", "Add equipment")}</Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="fleet">{t("Flotă", "Fleet")}</TabsTrigger>
            <TabsTrigger value="docs">{t("Documente", "Documents")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <Card key={k.label}><CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><k.icon className="h-4 w-4 text-primary" />{k.label}</div>
                  <div className="text-xl font-bold mt-2">{k.value}</div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle className="text-base">{t("Evoluție venituri nete (6 luni)", "Net revenue (6 months)")}</CardTitle></CardHeader>
                <CardContent><div className="flex items-end gap-3 h-40">
                  {stats.months.map((m) => (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{m.v ? Math.round(m.v) : ""}</span>
                      <div className="w-full rounded-t-md bg-primary" style={{ height: `${(m.v / max) * 100}%`, minHeight: 2 }} />
                      <span className="text-xs text-muted-foreground capitalize">{m.label}</span>
                    </div>
                  ))}
                </div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">{t("Calendar rezervări – 14 zile", "Bookings – next 14 days")}</CardTitle></CardHeader>
                <CardContent><div className="grid grid-cols-7 gap-2">
                  {days.map((d) => {
                    const iso = format(d, "yyyy-MM-dd");
                    const n = stats.active.filter((r) => r.start_date <= iso && r.end_date >= iso).length;
                    return (
                      <div key={iso} className={`rounded-lg border p-2 text-center ${n ? "bg-primary/10 border-primary/40" : ""}`}>
                        <div className="text-[10px] text-muted-foreground">{format(d, "dd.MM")}</div>
                        <div className="text-xs font-semibold">{n ? `${n} rez.` : t("liber", "free")}</div>
                      </div>
                    );
                  })}
                </div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="mt-4">
            {products.length === 0 ? <p className="text-muted-foreground py-8 text-center">{t("Nu ai încă echipamente.", "No equipment yet.")}</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p: any) => {
                  const rented = stats.rentedIds.has(p.id);
                  const status = p.approval_status !== "approved" ? t("În aprobare", "Pending") : !p.is_active ? t("Inactiv", "Inactive") : rented ? t("Închiriat", "Rented") : t("Disponibil", "Available");
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="h-36 w-full object-cover" loading="lazy" />}
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between gap-2"><h3 className="font-semibold line-clamp-1">{p.title}</h3><Badge variant={rented ? "default" : "secondary"}>{status}</Badge></div>
                        <p className="text-xs text-muted-foreground">{p.location_city} · {rentals.filter((r) => r.product_id === p.id).length} {t("închirieri", "rentals")}</p>
                        <p className="font-bold">{ron(Number(p.daily_price_owner))}/{t("zi", "day")}</p>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/anunturi")}>{t("Gestionează", "Manage")}</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant={docFilter === "all" ? "default" : "outline"} onClick={() => setDocFilter("all")}>{t("Toate", "All")}</Button>
                <Button size="sm" variant={docFilter === "done" ? "default" : "outline"} onClick={() => setDocFilter("done")}>{t("Finalizate", "Completed")}</Button>
              </div>
              <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />{t("Raport contabil CSV", "Accounting CSV")}</Button>
            </div>
            <Card><CardContent className="p-0 divide-y">
              {docs.length === 0 && <p className="p-6 text-center text-muted-foreground">{t("Niciun document încă.", "No documents yet.")}</p>}
              {docs.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{r.product_title_snapshot ?? r.public_id}</p>
                    <p className="text-xs text-muted-foreground">{r.public_id} · {r.start_date} → {r.end_date} · {t("Contract, PV predare/retur", "Contract, handover/return PV")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{ron(Number(r.owner_payout))}</span>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/inchirieri/${r.public_id}`)}>{t("Documente", "Documents")}</Button>
                  </div>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
