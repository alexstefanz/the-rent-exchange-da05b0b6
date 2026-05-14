import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Flag, EyeOff, Ban, MessageCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  listMessageReports, hideMessage, resolveReport, banIdentifier,
  CATEGORY_LABELS_RO, CATEGORY_COLORS,
  type MessageReportRow, type ReportAction,
} from "@/features/admin/messageReportsApi";
import { banUser } from "@/features/admin/banApi";

type StatusFilter = "open" | "resolved" | "all";

const AdminReports = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [selected, setSelected] = useState<MessageReportRow | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-message-reports", status],
    queryFn: () => listMessageReports({ status, limit: 200 }),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reports" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-message-reports"] });
        qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-destructive" />
          <h1 className="text-xl font-bold tracking-tight">Reports</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">— Mesaje raportate</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triaj rapoarte</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="open">Deschise</TabsTrigger>
                <TabsTrigger value="resolved">Rezolvate</TabsTrigger>
                <TabsTrigger value="all">Toate</TabsTrigger>
              </TabsList>
              <TabsContent value={status} className="mt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Flag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>Niciun raport în această categorie.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors flex items-start gap-4"
                      >
                        <div className="shrink-0 space-y-1">
                          <p className="font-mono text-[10px] text-primary font-semibold">{r.public_id}</p>
                          <Badge className={CATEGORY_COLORS[r.category]} variant="outline">
                            {CATEGORY_LABELS_RO[r.category]}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">
                            {r.message_content || <span className="italic text-muted-foreground">[mesaj șters]</span>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Autor: <span className="font-medium">{r.author_name || "—"}</span>
                            {" · "}Raportat de: {r.reporter_name || "—"}
                            {" · "}{format(new Date(r.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
                          </p>
                          {r.message_is_hidden && (
                            <Badge variant="secondary" className="mt-1 text-[10px]"><EyeOff className="h-3 w-3 mr-1" />Ascuns</Badge>
                          )}
                        </div>
                        {r.resolved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Rezolvat</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ReportDetailSheet
        report={selected}
        onClose={() => setSelected(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ["admin-message-reports"] })}
      />
    </AdminLayout>
  );
};

function ReportDetailSheet({
  report, onClose, onChanged,
}: { report: MessageReportRow | null; onClose: () => void; onChanged: () => void }) {
  const [action, setAction] = useState<ReportAction>("warning");
  const [notes, setNotes] = useState("");
  const [banAccount, setBanAccount] = useState(false);
  const [banEmail, setBanEmail] = useState(false);
  const [hideMsg, setHideMsg] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (report) {
      setAction("warning"); setNotes(""); setBanAccount(false); setBanEmail(false); setHideMsg(true);
    }
  }, [report?.id]);

  if (!report) return null;

  const handleResolve = async () => {
    setBusy(true);
    try {
      if (hideMsg && report.message_id && !report.message_is_hidden) {
        await hideMessage(report.message_id);
      }
      let finalAction = action;
      if (banAccount && report.author_id) {
        await banUser(report.author_id, notes || `Raport ${report.public_id}: ${CATEGORY_LABELS_RO[report.category]}`,
          (await supabase.auth.getUser()).data.user?.id || "");
        finalAction = "user_banned";
        if (banEmail && report.author_email) {
          await banIdentifier({ type: "email", value: report.author_email, reason: `Report ${report.public_id}` });
        }
      } else if (hideMsg) {
        finalAction = "message_hidden";
      }
      const ok = await resolveReport(report.id, { action_taken: finalAction, admin_notes: notes });
      if (ok) {
        toast.success("Raport rezolvat");
        onChanged();
        onClose();
      } else {
        toast.error("Eroare la rezolvare");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!report} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="font-mono text-sm">{report.public_id}</span>
            <Badge className={CATEGORY_COLORS[report.category]} variant="outline">
              {CATEGORY_LABELS_RO[report.category]}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-5">
          <div>
            <Label className="text-xs text-muted-foreground">Mesaj raportat</Label>
            <div className="mt-1 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap break-words">
              {report.message_content || <span className="italic">[mesaj indisponibil]</span>}
            </div>
            {report.conversation_id && (
              <Link
                to={`/admin/conversations/${report.conversation_id}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
              >
                <MessageCircle className="h-3 w-3" /> Vezi conversația completă
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Autor mesaj</Label>
              <p>{report.author_name || "—"}</p>
              {report.author_email && <p className="text-xs text-muted-foreground">{report.author_email}</p>}
              {report.author_id && (
                <Link to={`/admin/users/${report.author_id}`} className="text-xs text-primary hover:underline">
                  Profil utilizator →
                </Link>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Raportat de</Label>
              <p>{report.reporter_name || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
              </p>
            </div>
          </div>

          {report.reason && (
            <div>
              <Label className="text-xs text-muted-foreground">Detalii reporter</Label>
              <p className="mt-1 text-sm p-2 rounded bg-muted/50">{report.reason}</p>
            </div>
          )}

          {!report.resolved && (
            <>
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Acțiuni moderare</Label>

                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={hideMsg}
                    onCheckedChange={(v) => setHideMsg(!!v)}
                    disabled={!!report.message_is_hidden}
                  />
                  <span>
                    <EyeOff className="h-3 w-3 inline mr-1" />
                    Ascunde mesajul de participanți
                    {report.message_is_hidden && <span className="text-xs text-muted-foreground ml-2">(deja ascuns)</span>}
                  </span>
                </label>

                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox checked={banAccount} onCheckedChange={(v) => setBanAccount(!!v)} />
                  <span><Ban className="h-3 w-3 inline mr-1" />Banează contul autorului</span>
                </label>

                {banAccount && (
                  <label className="flex items-start gap-2 text-sm cursor-pointer ml-6">
                    <Checkbox checked={banEmail} onCheckedChange={(v) => setBanEmail(!!v)} disabled={!report.author_email} />
                    <span>Blochează și emailul ({report.author_email || "—"}) la reînregistrare</span>
                  </label>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Acțiune marcată</Label>
                  <Select value={action} onValueChange={(v) => setAction(v as ReportAction)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Fără acțiune</SelectItem>
                      <SelectItem value="warning">Avertizare</SelectItem>
                      <SelectItem value="message_hidden">Mesaj ascuns</SelectItem>
                      <SelectItem value="user_banned">Utilizator banat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Note interne</Label>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalii decizie..." />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" onClick={onClose} disabled={busy} className="flex-1">Anulează</Button>
                <Button onClick={handleResolve} disabled={busy} className="flex-1">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Marchează rezolvat
                </Button>
              </div>
            </>
          )}

          {report.resolved && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Rezolvat</Badge>
              <p><span className="text-muted-foreground">Acțiune:</span> {report.action_taken}</p>
              {report.admin_notes && <p><span className="text-muted-foreground">Note:</span> {report.admin_notes}</p>}
              {report.resolved_at && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(report.resolved_at), "d MMM yyyy, HH:mm", { locale: ro })}
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AdminReports;
