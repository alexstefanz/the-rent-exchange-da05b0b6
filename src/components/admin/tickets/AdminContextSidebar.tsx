import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Package, Calendar, MessageCircle, Sparkles, Wand2, ListChecks, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  updateOpsTicketField,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_GROUP_LABELS,
  CATEGORY_TYPES,
  type OpsTicket,
} from "@/features/admin/opsTicketsApi";
import { useTicketAuditLog } from "@/hooks/queries/useOpsTickets";

interface Props {
  ticket: OpsTicket;
  onAiSuggestReply: (text: string) => void;
}

export function AdminContextSidebar({ ticket, onAiSuggestReply }: Props) {
  const qc = useQueryClient();
  const { data: auditLog } = useTicketAuditLog(ticket.id);
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAiLoading] = useState<null | "summarize" | "suggest_reply" | "suggest_action">(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiActionRec, setAiActionRec] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["opsTicket", ticket.id] });
    qc.invalidateQueries({ queryKey: ["ticketAuditLog", ticket.id] });
    qc.invalidateQueries({ queryKey: ["opsTickets"] });
  };

  const updateField = async (field: string, val: string, action: string) => {
    setUpdating(true);
    try {
      await updateOpsTicketField(ticket.id, field, (ticket as any)[field], val, action);
      toast.success("Actualizat");
      invalidate();
    } catch { toast.error("Eroare"); } finally { setUpdating(false); }
  };

  const runAi = async (mode: "summarize" | "suggest_reply" | "suggest_action") => {
    setAiLoading(mode);
    try {
      const { data, error } = await supabase.functions.invoke("support-ai-admin-assist", {
        body: { ticketId: ticket.id, mode },
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim();
      if (!text) throw new Error("Răspuns gol AI");
      if (mode === "summarize") setAiSummary(text);
      else if (mode === "suggest_action") setAiActionRec(text);
      else if (mode === "suggest_reply") {
        onAiSuggestReply(text);
        toast.success("Răspuns sugerat — revizuiește înainte de a trimite");
      }
    } catch (e: any) {
      toast.error(e?.message || "Eroare AI");
    } finally { setAiLoading(null); }
  };

  const categoryTypeLabel = CATEGORY_TYPES[ticket.category_group]?.find(t => t.value === ticket.category_type)?.label || ticket.category_type;

  return (
    <div className="flex flex-col h-full bg-card overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Status & priority */}
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Acțiuni rapide</h3>
          <div>
            <label className="text-[11px] text-muted-foreground">Status</label>
            <Select value={ticket.status} onValueChange={(v) => updateField("status", v, "STATUS_CHANGED")} disabled={updating}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Prioritate</label>
            <Select value={ticket.priority} onValueChange={(v) => updateField("priority", v, "PRIORITY_CHANGED")} disabled={updating}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Separator />

        {/* AI Assist */}
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Assist
          </h3>
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full h-8 justify-start text-xs"
              onClick={() => runAi("summarize")} disabled={aiLoading !== null}>
              {aiLoading === "summarize" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <ListChecks className="h-3 w-3 mr-1.5" />}
              Sumarizează
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 justify-start text-xs"
              onClick={() => runAi("suggest_reply")} disabled={aiLoading !== null || ticket.status === "CLOSED"}>
              {aiLoading === "suggest_reply" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Wand2 className="h-3 w-3 mr-1.5" />}
              Sugerează răspuns
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 justify-start text-xs"
              onClick={() => runAi("suggest_action")} disabled={aiLoading !== null}>
              {aiLoading === "suggest_action" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
              Recomandă acțiune
            </Button>
          </div>
          {aiSummary && (
            <div className="text-[11px] whitespace-pre-wrap bg-primary/5 border border-primary/20 rounded-md p-2 mt-2">
              <p className="font-semibold uppercase tracking-wide text-primary mb-1 text-[9px]">Sumar</p>
              {aiSummary}
            </div>
          )}
          {aiActionRec && (
            <div className="text-[11px] whitespace-pre-wrap bg-primary/5 border border-primary/20 rounded-md p-2">
              <p className="font-semibold uppercase tracking-wide text-primary mb-1 text-[9px]">Recomandare</p>
              {aiActionRec}
            </div>
          )}
        </section>

        <Separator />

        {/* Context */}
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Context</h3>
          <div className="space-y-1.5 text-xs">
            {ticket.requester_user_id && (
              <ContextRow icon={User} label="Creat de"
                href={`/admin/users/${ticket.requester_user_id}`}
                value={ticket.requester_name || "Utilizator"} />
            )}
            {ticket.requester_email && (
              <p className="text-[11px] text-muted-foreground pl-5 -mt-1">{ticket.requester_email}</p>
            )}
            {ticket.reservation_id && (
              <ContextRow icon={Calendar} label="Rezervare"
                href={`/admin/reservations`} value="Vezi rezervarea" />
            )}
            {ticket.product_id && (
              <ContextRow icon={Package} label="Produs"
                href={`/admin/products`} value="Vezi produsul" />
            )}
            {ticket.rental_user_id && (
              <ContextRow icon={User} label="Chiriaș"
                href={`/utilizator/${ticket.rental_user_id}`} value="Profil chiriaș" />
            )}
            {ticket.owner_user_id && (
              <ContextRow icon={User} label="Proprietar"
                href={`/utilizator/${ticket.owner_user_id}`} value="Profil owner" />
            )}
            {ticket.rental_user_id && ticket.owner_user_id && (
              <ContextRow icon={MessageCircle} label="Chat"
                href={`/admin/conversations?buyer=${ticket.rental_user_id}&owner=${ticket.owner_user_id}`}
                value="Vezi conversația" />
            )}

            <div className="pt-2 space-y-0.5 text-[11px] text-muted-foreground">
              <p>Categorie: <span className="text-foreground">{CATEGORY_GROUP_LABELS[ticket.category_group]} · {categoryTypeLabel}</span></p>
              <p>Creat: {format(new Date(ticket.created_at), "d MMM yyyy HH:mm", { locale: ro })}</p>
              <p>Actualizat: {format(new Date(ticket.updated_at), "d MMM yyyy HH:mm", { locale: ro })}</p>
              {ticket.closed_at && <p>Închis: {format(new Date(ticket.closed_at), "d MMM yyyy HH:mm", { locale: ro })}</p>}
            </div>

            {ticket.tags && ticket.tags.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1">
                {ticket.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Audit log */}
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
            <History className="h-3 w-3" /> Audit ({auditLog?.length || 0})
          </h3>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {(auditLog || []).slice(0, 20).map((e) => (
              <div key={e.id} className="text-[11px] border-l-2 border-muted pl-2 py-0.5">
                <p className="font-medium">{e.action.replace(/_/g, " ").toLowerCase()}</p>
                {(e.old_value || e.new_value) && (
                  <p className="text-muted-foreground">
                    {e.old_value && <>de la <span className="font-mono">{e.old_value}</span></>}
                    {e.old_value && e.new_value && " → "}
                    {e.new_value && <span className="font-mono">{e.new_value}</span>}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">{format(new Date(e.created_at), "d MMM HH:mm", { locale: ro })}</p>
              </div>
            ))}
            {(!auditLog || auditLog.length === 0) && (
              <p className="text-[11px] text-muted-foreground">Niciun eveniment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ContextRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <Link to={href} className="text-primary hover:underline font-medium truncate">{value}</Link>
    </div>
  );
}