import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, MessageSquare, Calendar, User, Package, Clock, Ticket as TicketIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  listPendingCancellationRequests,
  listResolvedCancellationRequests,
  adminApproveCancellation,
  adminRejectCancellation,
  openAdminConversation,
  describeCancellationReason,
  type PendingCancellationRequest,
  type ResolvedCancellationRequest,
} from "@/features/admin/cancellationRequestsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const AdminCancellationRequestsPanel = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rejectFor, setRejectFor] = useState<PendingCancellationRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [innerTab, setInnerTab] = useState<"pending" | "archive">("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-cancellation-requests"],
    queryFn: listPendingCancellationRequests,
  });

  const { data: archive = [], isLoading: isArchiveLoading } = useQuery({
    queryKey: ["admin-cancellation-requests-archive"],
    queryFn: listResolvedCancellationRequests,
  });

  const archiveRentalIds = useMemo(() => archive.map((r) => r.rental_id), [archive]);

  const { data: refundTickets = {} } = useQuery({
    queryKey: ["admin-cancel-refund-tickets", archiveRentalIds],
    enabled: archiveRentalIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from("ops_tickets" as any) as any)
        .select("id, public_id, status, reservation_id, tags")
        .in("reservation_id", archiveRentalIds)
        .contains("tags", ["cancel-refund"]);
      if (error) throw error;
      const map: Record<string, { id: string; public_id: string; status: string }> = {};
      for (const t of (data || []) as any[]) {
        if (t.reservation_id && !map[t.reservation_id]) {
          map[t.reservation_id] = { id: t.id, public_id: t.public_id, status: t.status };
        }
      }
      return map;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-cancellation-requests"] });
    queryClient.refetchQueries({ queryKey: ["admin-cancellation-requests-archive"] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApproveCancellation(id),
    onSuccess: () => {
      toast.success("Anulare aprobată. Refundul a fost inițiat.");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la aprobare"),
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: string; note: string }) => adminRejectCancellation(params.id, params.note),
    onSuccess: () => {
      toast.success("Cerere respinsă");
      setRejectFor(null);
      setRejectNote("");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la respingere"),
  });

  const handleContact = async (userId: string, productId: string | null, rentalId: string) => {
    try {
      const conversationId = await openAdminConversation(userId, productId, rentalId);
      navigate(`/mesaje?conv=${conversationId}`, {
        state: { returnTo: { pathname: window.location.pathname, search: window.location.search } },
      });
    } catch (e: any) {
      toast.error(e?.message || "Eroare la deschiderea conversației");
    }
  };

  const renderCard = (r: PendingCancellationRequest, opts?: { archived?: ResolvedCancellationRequest }) => {
        const initiatorIsRenter = r.initiator_role === "renter";
        const initiatorName = initiatorIsRenter ? r.renter_name : r.owner_name;
        const ageHrs = Math.floor((Date.now() - new Date(r.cancel_request_created_at).getTime()) / 3_600_000);
        const archived = opts?.archived;
        const ticket = archived ? refundTickets[r.rental_id] : undefined;
        return (
          <Card key={r.rental_id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="grid md:grid-cols-[120px_1fr_auto] gap-4">
                {r.product_image ? (
                  <img src={r.product_image} alt={r.product_title || ""} className="w-full h-28 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-28 bg-muted rounded-lg grid place-items-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                )}
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold truncate">{r.product_title}</h3>
                    {r.rental_public_id && <Badge variant="outline">{r.rental_public_id}</Badge>}
                    {archived ? (
                      <>
                        {archived.cancel_request_status === "direct" ? (
                          <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" /> {describeCancellationReason(archived.cancellation_reason)}</Badge>
                        ) : archived.cancel_request_status === "approved" ? (
                          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white"><Check className="h-3 w-3" /> Aprobată</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Respinsă</Badge>
                        )}
                        {archived.cancel_request_responded_at && (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(archived.cancel_request_responded_at), "d MMM yyyy, HH:mm", { locale: ro })}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> acum {ageHrs}h</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                      {format(new Date(r.start_date), "d MMM", { locale: ro })} – {format(new Date(r.end_date), "d MMM yyyy", { locale: ro })} ({r.total_days} zile)
                    </span>
                    <span>{Number(r.subtotal).toFixed(2)} RON + comision {Number(r.platform_fee).toFixed(2)} RON</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Inițiator: </span>
                    <span className="font-medium">{initiatorName || "—"}</span>{" "}
                    <Badge variant="outline" className="ml-1">{initiatorIsRenter ? "chiriaș" : "proprietar"}</Badge>
                  </div>
                  {r.cancel_request_subject && (
                    <div className="text-sm bg-muted/50 rounded-lg p-2">
                      <span className="font-semibold">Subiect:</span> {r.cancel_request_subject}
                    </div>
                  )}
                  {r.cancel_request_reason && (
                    <div className="text-sm bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                      <span className="font-semibold">Motiv:</span> {r.cancel_request_reason}
                    </div>
                  )}
                  {archived?.cancel_request_response_note && (
                    <div className="text-sm bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                      <span className="font-semibold">Răspuns admin:</span> {archived.cancel_request_response_note}
                    </div>
                  )}
                  {archived?.cancel_request_admin_note && archived.cancel_request_admin_note !== archived.cancel_request_response_note && (
                    <div className="text-sm bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                      <span className="font-semibold">Notă admin:</span> {archived.cancel_request_admin_note}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => handleContact(r.renter_id, r.product_id, r.rental_id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat chiriaș
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContact(r.owner_id, r.product_id, r.rental_id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat proprietar
                    </Button>
                    {ticket && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/tickets?ticket=${ticket.public_id}`)}>
                        <TicketIcon className="h-3.5 w-3.5 mr-1" /> Tichet {ticket.public_id}
                      </Button>
                    )}
                  </div>
                </div>
                {!archived && (
                <div className="flex md:flex-col gap-2 md:min-w-[170px] md:self-start">
                  <Button
                    onClick={() => approveMutation.mutate(r.rental_id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 h-11 text-sm"
                  >
                    <Check className="h-4 w-4 mr-1.5" /> Aprobă
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectFor(r)}
                    className="flex-1 h-11 text-sm"
                  >
                    <X className="h-4 w-4 mr-1.5" /> Respinge
                  </Button>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
  };

  return (
    <div className="space-y-4">
      <Tabs value={innerTab} onValueChange={(v) => setInnerTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            În așteptare
            {requests.length > 0 && <Badge variant="secondary" className="ml-1">{requests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-1.5">
            Arhivă
            {archive.length > 0 && <Badge variant="secondary" className="ml-1">{archive.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nu sunt cereri de anulare în așteptare.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requests.map((r) => renderCard(r))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          {isArchiveLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : archive.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nicio cerere procesată încă.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {archive.map((r) => renderCard(r, { archived: r }))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) { setRejectFor(null); setRejectNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge cererea de anulare</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Notă pentru ambele părți (opțional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Renunță</Button>
            <Button
              variant="destructive"
              onClick={() => rejectFor && rejectMutation.mutate({ id: rejectFor.rental_id, note: rejectNote.trim() })}
              disabled={rejectMutation.isPending}
            >
              Respinge cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCancellationRequestsPanel;
