import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, MessageSquare, Calendar, User, Package, Clock } from "lucide-react";
import {
  listPendingCancellationRequests,
  adminApproveCancellation,
  adminRejectCancellation,
  openAdminConversation,
  type PendingCancellationRequest,
} from "@/features/admin/cancellationRequestsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const AdminCancellationRequestsPanel = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rejectFor, setRejectFor] = useState<PendingCancellationRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-cancellation-requests"],
    queryFn: listPendingCancellationRequests,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApproveCancellation(id),
    onSuccess: () => {
      toast.success("Anulare aprobată. Refundul a fost inițiat.");
      queryClient.invalidateQueries({ queryKey: ["admin-cancellation-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la aprobare"),
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: string; note: string }) => adminRejectCancellation(params.id, params.note),
    onSuccess: () => {
      toast.success("Cerere respinsă");
      setRejectFor(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-cancellation-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || "Eroare la respingere"),
  });

  const handleContact = async (userId: string, productId: string | null, rentalId: string) => {
    try {
      const conversationId = await openAdminConversation(userId, productId, rentalId);
      navigate(`/mesaje?conv=${conversationId}`);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la deschiderea conversației");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nu sunt cereri de anulare în așteptare.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{requests.length} cereri în așteptare</Badge>
      </div>
      {requests.map((r) => {
        const initiatorIsRenter = r.initiator_role === "renter";
        const initiatorName = initiatorIsRenter ? r.renter_name : r.owner_name;
        const ageHrs = Math.floor((Date.now() - new Date(r.cancel_request_created_at).getTime()) / 3_600_000);
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
                    <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> acum {ageHrs}h</Badge>
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => handleContact(r.renter_id, r.product_id, r.rental_id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat chiriaș
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContact(r.owner_id, r.product_id, r.rental_id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat proprietar
                    </Button>
                  </div>
                </div>
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
              </div>
            </CardContent>
          </Card>
        );
      })}

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
