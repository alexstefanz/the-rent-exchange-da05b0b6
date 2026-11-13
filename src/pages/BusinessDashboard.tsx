import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, parseISO, startOfMonth, subMonths, isWithinInterval } from "date-fns";
import { Building2, Package, CalendarDays, FileText, Download, Loader2, TrendingUp, Wallet, Percent, Activity, LayoutDashboard, ClipboardList, Menu, Plus, ArrowLeft, LogOut, ShoppingBag, MessageSquare, Settings, Wallet as WalletIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RentalsTab from "@/components/dashboard/RentalsTab";
import EarningsTab from "@/components/profile/EarningsTab";
import AccountTab from "@/components/profile/AccountTab";
import Messages from "@/pages/Messages";
import RentalDetailPage from "@/pages/RentalDetailPage";
import ListingsPage from "@/pages/ListingsPage";
import RentalsOutTab from "@/components/dashboard/RentalsOutTab";
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
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [docFilter, setDocFilter] = useState<"all" | "done">("all");
  const [params, setParams] = useSearchParams();
  const [section, setSectionState] = useState(params.get("section") || "overview");
  const setSection = (id: string) => { setSectionState(id); setParams(id === "overview" ? {} : { section: id }, { replace: true }); };
  const [mobileOpen, setMobileOpen] = useState(false);
  const rentalId = params.get("rental");
  const openRental = (id: string) => setParams({ section, rental: id });
  const closeRental = () => setParams(section === "overview" ? {} : { section });

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
    { icon: Package, label: t("Echipamente disponibile", "Available equipment"), value: String(products.filter((p: any) => p.approval_status === "approved" && p.is_active && !stats.rentedIds.has(p.id)).length) },
    { icon: Percent, label: t("Echipamente închiriate", "Rented equipment"), value: String(stats.rentedIds.size) },
    { icon: FileText, label: t("Comisioane Rentli", "Rentli fees"), value: ron(stats.fees) },
    { icon: Building2, label: t("Închirieri finalizate", "Completed"), value: String(stats.done.length) },
  ];

  const decided = rentals.filter((r) => r.status !== "pending");
  const accepted = decided.filter((r) => r.status !== "rejected" && r.status !== "cancelled");
  const perf = [
    { label: t("Grad de utilizare flotă (30 zile)", "Fleet utilization (30d)"), v: stats.utilization },
    { label: t("Rată acceptare rezervări", "Booking acceptance rate"), v: decided.length ? Math.round((accepted.length / decided.length) * 100) : 0 },
    { label: t("Închirieri finalizate", "Completed rentals"), v: decided.length ? Math.round((stats.done.length / decided.length) * 100) : 0 },
  ];
  const nav = [
    { id: "overview", icon: LayoutDashboard, label: t("Prezentare generală", "Overview") },
    { id: "fleet", icon: Package, label: t("Gestiune flotă", "Fleet") },
    { id: "listings", icon: ClipboardList, label: t("Echipamentele mele de închiriat", "My rental equipment") },
    { id: "calendar", icon: CalendarDays, label: t("Calendar & rezervări", "Calendar & bookings") },
    { id: "requests", icon: ClipboardList, label: t("Închirieri primite", "Incoming rentals") },
    { id: "docs", icon: FileText, label: t("Documente & contabilitate", "Documents & accounting") },
    { id: "company", icon: Building2, label: t("Date fiscale", "Company details") },
    { id: "renter", icon: ShoppingBag, label: t("Închirierile mele (chiriaș)", "My rentals (renter)"), group: "account" },
    { id: "messages", icon: MessageSquare, label: t("Mesaje", "Messages"), group: "account" },
    { id: "wallet", icon: WalletIcon, label: t("Încasări & sold", "Earnings & balance"), group: "account" },
    { id: "settings", icon: Settings, label: t("Setări cont", "Account settings"), group: "account" },
  ] as { id: string; icon: any; label: string; group?: string }[];
  const go = (id: string) => { setSectionState(id); setParams(id === "overview" ? {} : { section: id }, { replace: true }); setMobileOpen(false); };
  const calendarCard = (
    <Card><CardHeader><CardTitle className="text-base">{t("Calendar rezervări – 14 zile", "Bookings – next 14 days")}</CardTitle></CardHeader>
      <CardContent><div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const n = stats.active.filter((r) => r.start_date <= iso && r.end_date >= iso).length;
          return (
            <div key={iso} className={`min-w-[68px] flex-1 rounded-xl border p-2 text-center ${n ? "bg-primary/10 border-primary/40" : "bg-card"}`}>
              <div className="text-[11px] text-muted-foreground">{d.toLocaleDateString("ro-RO", { weekday: "short" })}</div>
              <div className="text-lg font-bold">{format(d, "d")}</div>
              <div className={`text-[11px] ${n ? "text-primary font-semibold" : "text-muted-foreground"}`}>{n ? `${n} rez.` : t("liber", "free")}</div>
            </div>
          );
        })}
      </div></CardContent></Card>
  );
  const navBtn = (active: boolean) => `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-biz-panel-foreground hover:bg-biz-panel-muted"}`;
  const panel = (
    <div className="flex h-full flex-col bg-biz-panel text-biz-panel-foreground">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">R</div>
        <div><p className="text-lg font-bold leading-none text-background">rentli</p><p className="mt-1 text-[11px] font-semibold tracking-widest text-primary">BUSINESS</p></div>
      </div>
      <div className="mx-3 mb-4 rounded-xl bg-biz-panel-muted p-3">
        <p className="text-sm font-semibold leading-tight text-background line-clamp-2">{profile?.company_name || t("Compania mea", "My company")}</p>
        <p className="mt-1 text-[11px] opacity-70">{profile?.cui && `CUI ${profile.cui}`}{profile?.reg_com && ` · ${profile.reg_com}`}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.filter((n) => !n.group).map((n) => (
          <button key={n.id} onClick={() => go(n.id)} className={navBtn(section === n.id)}><n.icon className="h-4 w-4" />{n.label}</button>
        ))}
        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider opacity-50">{t("Cont firmă", "Company account")}</p>
        {nav.filter((n) => n.group).map((n) => (
          <button key={n.id} onClick={() => go(n.id)} className={navBtn(section === n.id)}><n.icon className="h-4 w-4" />{n.label}</button>
        ))}
      </nav>
      <div className="space-y-1 border-t border-biz-panel-muted p-3">
        <button onClick={() => navigate("/")} className={navBtn(false)}><ArrowLeft className="h-4 w-4" />{t("Înapoi la Rentli", "Back to Rentli")}</button>
        {signOut && <button onClick={async () => { await signOut(); navigate("/", { replace: true }); }} className={navBtn(false)}><LogOut className="h-4 w-4" />{t("Deconectare", "Sign out")}</button>}
      </div>
    </div>
  );
  const current = nav.find((n) => n.id === section) ?? nav[0];

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className="hidden md:block w-72 shrink-0 sticky top-0 h-screen">{panel}</aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">{panel}</SheetContent>
          </Sheet>
          <span className="font-bold text-primary">Rentli Business</span>
        </div>
        <div className="p-4 md:p-8 space-y-6 w-full" onClickCapture={(e) => {
          const a = (e.target as HTMLElement).closest("a");
          const m = a?.getAttribute("href")?.match(/^\/(?:rezervari|inchirieri)\/([^/?#]+)/);
          if (m) { e.preventDefault(); e.stopPropagation(); openRental(decodeURIComponent(m[1])); }
        }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{section === "overview" ? `${t("Salut", "Hello")}, ${profile?.company_name || ""}` : current.label}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("Prezentare generală a activității Rentli Business", "Rentli Business activity overview")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => go("fleet")}>{t("Echipamente", "Equipment")}</Button>
            <Button onClick={() => navigate("/owner/new-product")}><Plus className="h-4 w-4 mr-1" />{t("Adaugă echipament", "Add equipment")}</Button>
          </div>
        </div>

        {rentalId ? <RentalDetailPage key={rentalId} embedded publicIdOverride={rentalId} onBack={closeRental} /> :
        <Tabs value={section} onValueChange={setSection}>
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <Card key={k.label} className="rounded-2xl"><CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2"><span className="text-sm text-muted-foreground">{k.label}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"><k.icon className="h-4 w-4 text-primary" /></span></div>
                  <div className="text-2xl font-bold mt-3">{k.value}</div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid xl:grid-cols-3 gap-6">
              <Card className="rounded-2xl xl:col-span-2"><CardHeader><CardTitle className="text-base">{t("Evoluție venituri (RON)", "Revenue (RON)")}</CardTitle></CardHeader>
                <CardContent><div className="flex items-end gap-4 h-56 border-b border-l pl-2">
                  {stats.months.map((m) => (
                    <div key={m.label} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">{m.v ? Math.round(m.v) : ""}</span>
                      <div className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-primary/60 to-primary" style={{ height: `${(m.v / max) * 85}%`, minHeight: 3 }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 pl-2 pt-2">{stats.months.map((m) => <span key={m.label} className="flex-1 text-center text-xs text-muted-foreground capitalize">{m.label}</span>)}</div>
                </CardContent></Card>
              <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">{t("Indicatori de performanță", "Performance")}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {perf.map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between text-sm mb-1.5"><span>{p.label}</span><span className="font-semibold">{p.v}%</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${p.v}%` }} /></div>
                    </div>
                  ))}
                </CardContent></Card>
            </div>
            <div className="grid xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">{calendarCard}</div>
              <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">{t("Ultimele tranzacții", "Latest transactions")}</CardTitle></CardHeader>
                <CardContent className="p-0 divide-y">
                  {rentals.slice(0, 4).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("Nicio tranzacție încă.", "No transactions yet.")}</p>}
                  {rentals.slice(0, 4).map((r) => (
                    <button key={r.id} onClick={() => openRental(r.public_id)} className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-muted/50">
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{r.product_title_snapshot ?? r.public_id}</p><p className="text-xs text-muted-foreground">{r.public_id} · {r.rental_days} {t("zile", "days")}</p></div>
                      <span className="text-sm font-semibold whitespace-nowrap">{ron(Number(r.owner_payout))}</span>
                    </button>
                  ))}
                </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="mt-0">
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
                        <Button size="sm" variant="outline" className="w-full" onClick={() => go("listings")}>{t("Gestionează", "Manage")}</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="listings" className="mt-0"><ListingsPage embedded /></TabsContent>

          <TabsContent value="docs" className="mt-0 space-y-4">
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
                    <Button size="sm" variant="outline" onClick={() => openRental(r.public_id)}>{t("Documente", "Documents")}</Button>
                  </div>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="calendar" className="mt-0 space-y-4">
            {calendarCard}
            <Card><CardHeader><CardTitle className="text-base">{t("Rezervări active și cereri", "Active bookings & requests")}</CardTitle></CardHeader>
              <CardContent className="p-0 divide-y">
                {[...stats.pending, ...stats.active].length === 0 && <p className="p-6 text-center text-muted-foreground">{t("Nicio rezervare activă.", "No active bookings.")}</p>}
                {[...stats.pending, ...stats.active].map((r) => (
                  <button key={r.id} onClick={() => openRental(r.public_id)} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50">
                    <div><p className="font-medium">{r.product_title_snapshot ?? r.public_id}</p><p className="text-xs text-muted-foreground">{r.public_id} · {r.start_date} → {r.end_date}</p></div>
                    <Badge variant={r.status === "pending" ? "secondary" : "default"}>{r.status === "pending" ? t("Cerere nouă", "New request") : t("Activă", "Active")}</Badge>
                  </button>
                ))}
              </CardContent></Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">{section === "requests" && <RentalsOutTab />}</TabsContent>
          <TabsContent value="renter" className="mt-0">{section === "renter" && <RentalsTab />}</TabsContent>
          <TabsContent value="messages" className="mt-0">{section === "messages" && <Messages embedded />}</TabsContent>
          <TabsContent value="wallet" className="mt-0">{section === "wallet" && <EarningsTab />}</TabsContent>
          <TabsContent value="settings" className="mt-0">{section === "settings" && <AccountTab />}</TabsContent>
          <TabsContent value="company" className="mt-0">
            <Card><CardContent className="p-6 grid sm:grid-cols-2 gap-4">
              {[[t("Denumire firmă", "Company name"), profile?.company_name], ["CUI", profile?.cui], [t("Nr. Reg. Com.", "Trade register no."), profile?.reg_com], [t("Adresă sediu", "Registered address"), profile?.company_address]].map(([l, v]) => (
                <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v || "—"}</p></div>
              ))}
              <div className="sm:col-span-2"><Button variant="outline" onClick={() => navigate("/onboarding/business")}>{t("Actualizează datele firmei", "Update company details")}</Button></div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>}
        </div>
      </main>
    </div>
  );
}
