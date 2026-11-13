import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Inbox, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminInboxList } from "@/components/admin/tickets/AdminInboxList";
import { AdminConversation } from "@/components/admin/tickets/AdminConversation";
import { AdminContextSidebar } from "@/components/admin/tickets/AdminContextSidebar";
import { useOpsTickets, useOpsTicket } from "@/hooks/queries/useOpsTickets";
import { useAdminTicketsRealtime } from "@/hooks/useTicketRealtime";
import { markTicketRead, type FetchTicketsFilters } from "@/features/admin/opsTicketsApi";
import { StatusPill } from "@/components/support/center/StatusPill";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const AdminTickets = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  const [filters, setFilters] = useState<FetchTicketsFilters>({});
  const [draftReply, setDraftReply] = useState("");
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);

  const { data: tickets, isLoading } = useOpsTickets(filters);
  const { data: activeTicket, isLoading: ticketLoading } = useOpsTicket(selectedId || undefined);

  useAdminTicketsRealtime(selectedId);

  // Mark as read when opening
  useEffect(() => {
    if (!selectedId) return;
    markTicketRead(selectedId)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["opsTickets"] });
        qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
        qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      })
      .catch(() => undefined);
  }, [selectedId, qc]);

  // Reset draft on ticket change
  useEffect(() => { setDraftReply(""); }, [selectedId]);

  const onSelect = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("id", id);
    setSearchParams(next, { replace: true });
  };
  const onClose = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  };

  const handleAiSuggestFromConv = async () => {
    if (!selectedId) return;
    setAiSuggestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("support-ai-admin-assist", {
        body: { ticketId: selectedId, mode: "suggest_reply" },
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim();
      if (!text) throw new Error("Răspuns gol AI");
      setDraftReply(text);
      toast.success("Răspuns sugerat — revizuiește înainte de a trimite");
    } catch (e: any) {
      toast.error(e?.message || "Eroare AI");
    } finally { setAiSuggestLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] -mx-4 -my-2 md:m-0 md:h-[calc(100vh-7rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_340px] border rounded-none md:rounded-xl overflow-hidden bg-card">
        {/* LEFT — inbox */}
        <div className={cn("border-r overflow-hidden", selectedId && "hidden md:block")}>
          <AdminInboxList
            tickets={tickets}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={onSelect}
            filters={filters}
            setFilters={setFilters}
            onNew={() => navigate("/admin/tickets/new")}
          />
        </div>

        {/* CENTER — conversation */}
        <div className={cn("flex flex-col overflow-hidden", !selectedId && "hidden md:flex")}>
          {!selectedId ? (
            <EmptyState />
          ) : ticketLoading || !activeTicket ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {/* Center header */}
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{activeTicket.public_id}</span>
                    <StatusPill status={activeTicket.status} size="xs" />
                    {aiSuggestLoading && (
                      <span className="text-[10px] text-primary inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> AI lucrează…
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-sm truncate">{activeTicket.title}</h2>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <AdminConversation
                  ticket={activeTicket}
                  onAiAssist={handleAiSuggestFromConv}
                  draftReply={draftReply}
                  setDraftReply={setDraftReply}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT — context (xl only; on mobile/tablet, scroll-down section below conv) */}
        {selectedId && activeTicket && (
          <>
            <div className="hidden xl:block border-l overflow-hidden">
              <AdminContextSidebar ticket={activeTicket} onAiSuggestReply={(t) => setDraftReply(t)} />
            </div>
            <div className="xl:hidden border-t md:border-l md:border-t-0 overflow-y-auto md:max-h-full md:hidden">
              {/* Mobile context tab placeholder — visible below conv on small screens */}
            </div>
          </>
        )}
      </div>

      {/* Mobile context drawer below conversation when ticket selected */}
      {selectedId && activeTicket && (
        <div className="xl:hidden mt-4 md:mt-3">
          <details className="border rounded-xl bg-card overflow-hidden">
            <summary className="px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer flex items-center gap-2">
              <Inbox className="h-3.5 w-3.5" /> Context, AI și acțiuni
            </summary>
            <AdminContextSidebar ticket={activeTicket} onAiSuggestReply={(t) => setDraftReply(t)} />
          </details>
        </div>
      )}
    </AdminLayout>
  );
};

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-7 w-7 opacity-50" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Selectează un tichet</h3>
      <p className="text-sm max-w-sm">
        Inbox realtime cu filtre rapide, conversație premium cu note interne și AI Assist integrat.
      </p>
    </div>
  );
}

export default AdminTickets;
