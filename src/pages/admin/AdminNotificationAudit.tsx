import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { Mail, MessageSquare, Bell, AlertCircle, CheckCircle2, Clock, MinusCircle } from "lucide-react";

interface AuditRow {
  id: string;
  rental_id: string | null;
  user_id: string;
  event_key: string;
  channel: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  payload: any;
  created_at: string;
}

interface RentalInfo { id: string; public_id: string; product_title_snapshot: string | null; owner_id: string | null; renter_id: string | null }
interface ProfileInfo { id: string; full_name: string | null; email: string | null }

const EVENT_LABELS: Record<string, string> = {
  request_created: "Cerere nouă de închiriere",
  request_accepted: "Cerere acceptată",
  request_rejected: "Cerere refuzată",
  request_expired: "Cerere expirată (24h)",
  request_reminder_2h: "Reminder: cerere fără răspuns",
  request_cancelled_by_renter: "Cerere anulată de chiriaș",
  request_cancelled_by_owner: "Cerere anulată de proprietar",
  payment_succeeded: "Plată confirmată",
  pickup_scheduled: "Predare programată",
  pv_pickup_pending: "PV predare de completat",
  pv_pickup_completed_by_party: "PV predare semnat de o parte",
  handover_confirmed: "Predare confirmată",
  active_rental_started: "Închiriere activă",
  return_reminder_24h: "Reminder returnare (24h)",
  return_reminder_2h: "Reminder returnare (2h)",
  return_in_progress: "Returnare începută",
  pv_return_pending: "PV returnare de completat",
  pv_return_completed_by_party: "PV returnare semnat de o parte",
  rental_completed: "Închiriere finalizată",
  review_reminder: "Reminder recenzie",
  dispute_opened: "Dispută deschisă",
  cancel_request_submitted: "Cerere de anulare trimisă",
  cancel_request_withdrawn: "Cerere de anulare retrasă",
  cancel_request_approved: "Anulare aprobată",
  cancel_request_rejected: "Anulare respinsă",
  cancellation_confirmed: "Anulare confirmată",
  mutual_cancel_approved: "Anulare de comun acord",
  early_return_proposed: "Returnare anticipată propusă",
};

const REASON_LABELS: Record<string, string> = {
  owner_email_filtered: "Proprietarul nu primește email pentru acest eveniment",
  opt_out: "Utilizatorul a dezactivat acest tip de notificare",
};

const CHANNEL_LABELS: Record<string, string> = { email: "Email", sms: "SMS", in_app: "În aplicație" };
const channelIcon = (c: string) => (c === "email" ? Mail : c === "sms" ? MessageSquare : Bell);

const statusInfo = (s: string) => {
  if (s === "sent" || s === "delivered") return { label: s === "delivered" ? "Livrat" : "Trimis", variant: "default" as const, Icon: CheckCircle2 };
  if (s === "failed") return { label: "Eșuat", variant: "destructive" as const, Icon: AlertCircle };
  if (s === "skipped") return { label: "Nu s-a trimis", variant: "outline" as const, Icon: MinusCircle };
  return { label: "În așteptare", variant: "secondary" as const, Icon: Clock };
};

export default function AdminNotificationAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [rentals, setRentals] = useState<Map<string, RentalInfo>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("notification_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const list = (data ?? []) as AuditRow[];
      const rentalIds = [...new Set(list.map((r) => r.rental_id).filter(Boolean))] as string[];
      const userIds = [...new Set(list.map((r) => r.user_id))];
      const [rRes, pRes] = await Promise.all([
        rentalIds.length
          ? supabase.from("rentals").select("id, public_id, product_title_snapshot, owner_id, renter_id").in("id", rentalIds)
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      if (!active) return;
      setRows(list);
      setRentals(new Map(((rRes.data ?? []) as RentalInfo[]).map((r) => [r.id, r])));
      setProfiles(new Map(((pRes.data ?? []) as ProfileInfo[]).map((p) => [p.id, p])));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const enriched = useMemo(() => rows.map((r) => {
    const rental = r.rental_id ? rentals.get(r.rental_id) : undefined;
    const profile = profiles.get(r.user_id);
    const role = rental ? (rental.owner_id === r.user_id ? "Proprietar" : rental.renter_id === r.user_id ? "Chiriaș" : null) : null;
    const reason = r.error ? (REASON_LABELS[r.error] ?? r.error) : "";
    return {
      ...r, rental, profile, role, reason,
      eventLabel: EVENT_LABELS[r.event_key] ?? r.event_key.replace(/_/g, " "),
    };
  }), [rows, rentals, profiles]);

  const q = filter.trim().toLowerCase();
  const filtered = enriched.filter((r) => !q || [
    r.eventLabel, r.event_key, CHANNEL_LABELS[r.channel], statusInfo(r.status).label, r.reason,
    r.rental?.public_id, r.rental?.product_title_snapshot, r.profile?.full_name, r.profile?.email, r.role,
  ].some((v) => (v ?? "").toLowerCase().includes(q)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notificări — Istoric</h1>
            <p className="text-sm text-muted-foreground">Ce mesaje (email, SMS, în aplicație) au primit utilizatorii pentru fiecare închiriere.</p>
          </div>
          <Input
            placeholder="Caută după nume, email, RNT, produs, eveniment…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> {filtered.length} notificări
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nicio înregistrare găsită.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2 px-2">Când</th>
                      <th className="text-left py-2 px-2">Ce s-a întâmplat</th>
                      <th className="text-left py-2 px-2">Închiriere</th>
                      <th className="text-left py-2 px-2">Destinatar</th>
                      <th className="text-left py-2 px-2">Canal</th>
                      <th className="text-left py-2 px-2">Rezultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const Icon = channelIcon(r.channel);
                      const st = statusInfo(r.status);
                      return (
                        <tr key={r.id} className="border-b align-top hover:bg-muted/30">
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <div className="text-xs font-medium">{format(new Date(r.created_at), "d MMM, HH:mm", { locale: ro })}</div>
                            <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ro })}</div>
                          </td>
                          <td className="py-2.5 px-2 font-medium">{r.eventLabel}</td>
                          <td className="py-2.5 px-2">
                            {r.rental ? (
                              <div className="min-w-0">
                                <Link to={`/rezervari/${r.rental.public_id}`} className="font-semibold text-primary hover:underline">
                                  {r.rental.public_id}
                                </Link>
                                {r.rental.product_title_snapshot && (
                                  <div className="text-xs text-muted-foreground max-w-[220px] truncate">{r.rental.product_title_snapshot}</div>
                                )}
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 px-2">
                            <Link to={`/admin/users/${r.user_id}`} className="font-medium hover:underline">
                              {r.profile?.full_name || r.profile?.email || "Utilizator necunoscut"}
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {r.role && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{r.role}</Badge>}
                              {r.profile?.full_name && r.profile?.email && <span className="max-w-[180px] truncate">{r.profile.email}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {CHANNEL_LABELS[r.channel] ?? r.channel}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <Badge variant={st.variant}><st.Icon className="h-3 w-3 mr-1" />{st.label}</Badge>
                            {r.reason && <div className="text-xs text-muted-foreground mt-1 max-w-[240px]">{r.reason}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
