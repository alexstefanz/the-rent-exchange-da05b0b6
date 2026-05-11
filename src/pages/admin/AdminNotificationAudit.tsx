import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { Mail, MessageSquare, Bell, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface AuditRow {
  id: string;
  rental_id: string | null;
  user_id: string;
  event_key: string;
  channel: "in_app" | "email" | "sms";
  status: "pending" | "sent" | "delivered" | "failed" | "skipped";
  provider_id: string | null;
  error: string | null;
  payload: any;
  created_at: string;
}

const channelIcon = (c: string) => c === "email" ? Mail : c === "sms" ? MessageSquare : Bell;
const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "sent" || s === "delivered") return "default";
  if (s === "failed") return "destructive";
  if (s === "skipped") return "outline";
  return "secondary";
};

export default function AdminNotificationAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
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
      if (active) {
        setRows((data ?? []) as AuditRow[]);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = rows.filter(r =>
    !filter ||
    r.event_key.includes(filter) ||
    r.channel.includes(filter) ||
    r.status.includes(filter) ||
    (r.error ?? "").toLowerCase().includes(filter.toLowerCase()) ||
    (r.rental_id ?? "").includes(filter)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notificări — Audit log</h1>
            <p className="text-sm text-muted-foreground">Toate dispatch-urile email / SMS / in-app pentru închirieri.</p>
          </div>
          <Input
            placeholder="Filtrează (event, status, rental id, eroare)…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Ultimele {filtered.length} înregistrări
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
                      <th className="text-left py-2 px-2">Event</th>
                      <th className="text-left py-2 px-2">Canal</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Rental</th>
                      <th className="text-left py-2 px-2">User</th>
                      <th className="text-left py-2 px-2">Detalii</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const Icon = channelIcon(r.channel);
                      return (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-2 whitespace-nowrap text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ro })}
                            </div>
                          </td>
                          <td className="py-2 px-2 font-medium">{r.event_key}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center gap-1">
                              <Icon className="h-3.5 w-3.5" /> {r.channel}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant={statusVariant(r.status)} className="capitalize">
                              {r.status === "failed" ? <AlertCircle className="h-3 w-3 mr-1" /> :
                               (r.status === "sent" || r.status === "delivered") ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 font-mono text-xs">{r.rental_id?.slice(0, 8) ?? "—"}</td>
                          <td className="py-2 px-2 font-mono text-xs">{r.user_id.slice(0, 8)}</td>
                          <td className="py-2 px-2 text-xs text-muted-foreground max-w-xs truncate">
                            {r.error ?? (r.payload?.template ? `tpl: ${r.payload.template}` : "")}
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