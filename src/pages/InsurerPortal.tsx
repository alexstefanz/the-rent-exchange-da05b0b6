import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText, Loader2, Search, ShieldCheck, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInspectionSignedUrl } from "@/features/rentals/inspectionApi";

type Row = {
  id: string; public_id: string; product_title: string | null; start_date: string; end_date: string;
  rental_days: number; status: string; payment_status: string; subtotal: number; platform_fee: number;
  stripe_fee: number; insurance_fee: number; deposit_value: number | null; dispute_status: string;
  owner_name: string | null; renter_name: string | null; created_at: string;
};

const ron = (n: number | null | undefined) => `${Number(n ?? 0).toFixed(2)} RON`;
const d = (s?: string | null) => (s ? format(new Date(s), "dd.MM.yyyy HH:mm") : "—");

const STATUS_FILTERS = [
  { v: "all", l: "Toate" }, { v: "active", l: "Active" }, { v: "completed", l: "Finalizate" },
  { v: "cancelled", l: "Anulate" }, { v: "dispute", l: "Cu dispută" }, { v: "insured", l: "Cu taxă asigurare" },
];

const InsurerPortal = () => {
  const { user, loading } = useAuth();
  const access = useQuery({
    queryKey: ["insurer-access", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("is_insurer_or_admin", { _uid: user!.id });
      return !!data;
    },
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rentals = useQuery({
    queryKey: ["insurer-rentals", search, status, from, to],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_insurer_rentals", {
        _search: search || null, _status: status === "all" ? null : status,
        _from: from || null, _to: to || null, _limit: 2000,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (loading || (user && access.isLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?redirect=/portal-asigurari" replace />;
  if (!access.data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div><ShieldX className="h-14 w-14 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-bold">Acces restricționat</h1>
          <p className="text-muted-foreground">Această zonă este rezervată partenerului de asigurări Rentli.</p></div>
      </div>
    );
  }

  const rows = rentals.data ?? [];
  const totals = rows.reduce((a, r) => ({ value: a.value + Number(r.subtotal), ins: a.ins + Number(r.insurance_fee) }), { value: 0, ins: 0 });

  const exportCsv = () => {
    const head = ["Cod", "Produs", "Inceput", "Sfarsit", "Zile", "Status", "Plata", "Chirie", "Comision", "Taxa Stripe", "Asigurare", "Garantie", "Disputa", "Proprietar", "Chirias"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [r.public_id, r.product_title, r.start_date, r.end_date, r.rental_days, r.status, r.payment_status,
      r.subtotal, r.platform_fee, r.stripe_fee, r.insurance_fee, r.deposit_value, r.dispute_status, r.owner_name, r.renter_name].map(esc).join(","));
    const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `raport-inchirieri-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Portal Asigurator Rentli</h1>
            <p className="text-xs text-muted-foreground">Acces doar pentru consultare — datele nu pot fi modificate</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Închirieri în raport</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Valoare chirii</p><p className="text-2xl font-bold">{ron(totals.value)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Taxe de asigurare</p><p className="text-2xl font-bold">{ron(totals.ins)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cod RNT, produs, nume..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_FILTERS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
            <div><label className="text-xs text-muted-foreground">De la</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Până la</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {rentals.isLoading ? <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cod</TableHead><TableHead>Produs</TableHead><TableHead>Perioadă</TableHead>
                  <TableHead>Proprietar</TableHead><TableHead>Chiriaș</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Chirie</TableHead><TableHead className="text-right">Asigurare</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r.id)}>
                      <TableCell className="font-mono">{r.public_id}</TableCell>
                      <TableCell>{r.product_title}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.start_date} → {r.end_date}</TableCell>
                      <TableCell>{r.owner_name}</TableCell>
                      <TableCell>{r.renter_name}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge>{r.dispute_status !== "none" && <Badge variant="destructive" className="ml-1">dispută</Badge>}</TableCell>
                      <TableCell className="text-right">{ron(r.subtotal)}</TableCell>
                      <TableCell className="text-right">{ron(r.insurance_fee)}</TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nicio închiriere găsită</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <RentalDetailDialog id={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const RentalDetailDialog = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const q = useQuery({
    queryKey: ["insurer-rental", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_insurer_rental_detail", { _rental_id: id! });
      if (error) throw error;
      const v = data as any;
      const photoRefs: { phase: string; role: string; ref: string }[] = [];
      for (const i of v?.inspections ?? []) for (const p of i.photos ?? []) photoRefs.push({ phase: i.phase, role: i.role, ref: p });
      const photos = await Promise.all(photoRefs.map(async (p) => ({ ...p, url: await getInspectionSignedUrl(p.ref) })));
      return { ...v, photos };
    },
  });

  const openPv = async (path: string) => {
    const { data } = await supabase.storage.from("rental-pvs").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const v = q.data;
  const r = v?.rental;
  const Party = ({ title, p }: { title: string; p: any }) => (
    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="text-sm space-y-1">
        <p className="font-medium">{p?.full_name ?? "—"}</p>
        {p?.company_name && <p>{p.company_name} {p.cui && `(CUI ${p.cui})`}</p>}
        <p>{p?.email ?? "—"}</p><p>{p?.phone ?? "—"}</p>
        <Badge variant="outline">Identitate: {p?.identity_status ?? "—"}</Badge>
      </CardContent></Card>
  );

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Dosar {r?.public_id ?? ""}</DialogTitle></DialogHeader>
        {q.isLoading || !v ? <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <div className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card><CardContent className="p-4 space-y-1">
                <p className="font-semibold">{v.product?.title}</p>
                <p>Categorie: {v.product?.category ?? "—"} · Stare: {v.product?.condition ?? "—"}</p>
                <p>Serie: {v.product?.serial_number ?? "—"} · Oraș: {v.product?.location_city ?? "—"}</p>
                <p>Garanție: {v.product?.deposit_value ? ron(v.product.deposit_value) : "—"}</p>
                <p>Perioadă: {r.start_date} → {r.end_date} ({r.rental_days} zile)</p>
                <p>Status: {r.status} · Plată: {r.payment_status}</p>
                <p>Predare: {d(r.handover_confirmed_at)} · Returnare: {d(r.return_confirmed_at)}</p>
                {r.dispute_status !== "none" && <p className="text-destructive">Dispută ({r.dispute_status}): {r.dispute_reason}</p>}
              </CardContent></Card>
              <Card><CardContent className="p-4 space-y-1">
                <p>Chirie: {ron(r.subtotal)}</p><p>Comision platformă: {ron(r.platform_fee)}</p>
                <p>Taxă Stripe: {ron(r.stripe_fee)}</p><p>Asigurare: {ron(r.insurance_fee)}</p>
                <p className="font-semibold">Total: {ron(Number(r.subtotal) + Number(r.platform_fee) + Number(r.stripe_fee) + Number(r.insurance_fee))}</p>
                <p className="pt-2">Contract semnat: {(v.contract ?? []).map((c: any) => `${c.role === "owner" ? "proprietar" : "chiriaș"} ${d(c.accepted_at)}`).join(", ") || "—"}</p>
              </CardContent></Card>
            </div>
            <div className="grid sm:grid-cols-2 gap-4"><Party title="Proprietar" p={v.owner} /><Party title="Chiriaș" p={v.renter} /></div>

            <div>
              <h3 className="font-semibold mb-2">Procese verbale</h3>
              <div className="flex flex-wrap gap-2">
                {(v.pvs ?? []).filter((p: any) => p.pdf_path).map((p: any) => (
                  <Button key={p.pdf_path} size="sm" variant="outline" onClick={() => openPv(p.pdf_path)}><FileText className="h-4 w-4 mr-1" />PV {p.phase === "checkout" ? "predare" : "retur"}</Button>
                ))}
                {(v.physical_pvs ?? []).map((p: any) => (
                  <Button key={p.file_path} size="sm" variant="outline" onClick={() => openPv(p.file_path)}><FileText className="h-4 w-4 mr-1" />PV fizic {p.phase} ({p.status})</Button>
                ))}
                {!(v.pvs ?? []).some((p: any) => p.pdf_path) && !(v.physical_pvs ?? []).length && <p className="text-muted-foreground">Niciun PV generat încă.</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Fotografii inspecție</h3>
              {!v.photos.length ? <p className="text-muted-foreground">Nicio fotografie.</p> : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {v.photos.map((p: any, i: number) => p.url && (
                    <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={p.url} alt={`${p.phase} ${p.role}`} className="aspect-square object-cover rounded-md" />
                      <p className="text-xs text-muted-foreground mt-1">{p.phase === "checkout" ? "Predare" : "Retur"} · {p.role === "owner" ? "proprietar" : "chiriaș"}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Istoric</h3>
              <ul className="space-y-1">{(v.history ?? []).map((h: any, i: number) => <li key={i}>{d(h.at)} — {h.from ?? "—"} → {h.to}{h.reason ? ` (${h.reason})` : ""}</li>)}</ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InsurerPortal;
