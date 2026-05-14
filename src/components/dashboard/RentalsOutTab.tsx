import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Check, X, Loader2, Calendar, TrendingUp, Inbox, MessageSquare, Clock, XCircle, Sparkles, ArrowRight, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerRentals, respondToRental, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { requestMutualCancellation } from "@/features/rentals/rentalsApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import StatusBadge from "./StatusBadge";

const RentalsOutTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRentalRealtime(user?.id, "owner", [["ownerRentals", user?.id]]);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["ownerRentals", user?.id],
    queryFn: () => getOwnerRentals(user!.id),
    enabled: !!user?.id,
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectDialogRental, setRejectDialogRental] = useState<OwnerRental | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelDialogRental, setCancelDialogRental] = useState<OwnerRental | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const pendingRentals = rentals.filter(r => r.status === "pending");
  const premiumActiveRentals = rentals.filter(
    r => (r.status === "confirmed" || r.status === "active") && !r.handover_confirmed_at
  );
  const premiumIds = new Set([...pendingRentals, ...premiumActiveRentals].map(r => r.id));
  const historyRentals = rentals.filter(r => !premiumIds.has(r.id));
  const activeRentals = rentals.filter(r => r.status === "confirmed" || r.status === "active");
  const cancelledRentals = rentals.filter(r => r.status === "cancelled");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEarnings = rentals
    .filter(r => (r.payment_status === "captured" || r.payment_status === "paid") && r.return_confirmed_at && new Date(r.return_confirmed_at) >= startOfMonth)
    .reduce((sum, r) => sum + Number(r.owner_payout || 0), 0);

  const handleAccept = async (rental: OwnerRental) => {
    setRespondingId(rental.id);
    try {
      await respondToRental(rental.id, "accept");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      toast.success("Cerere acceptată. Așteptăm plata chiriașului.");
    } catch (e) { toast.error("Eroare la acceptarea cererii"); console.error(e); }
    finally { setRespondingId(null); }
  };

  const handleReject = async () => {
    if (!rejectDialogRental) return;
    setRespondingId(rejectDialogRental.id);
    try {
      await respondToRental(rejectDialogRental.id, "reject", rejectReason || undefined);
      toast.success("Cererea a fost refuzată");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      setRejectDialogRental(null);
      setRejectReason("");
    } catch (e) { toast.error("Eroare la refuzarea cererii"); console.error(e); }
    finally { setRespondingId(null); }
  };

  const handleRequestCancel = async () => {
    if (!cancelDialogRental) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("Te rugăm să adaugi un motiv (minim 5 caractere)");
      return;
    }
    setRespondingId(cancelDialogRental.id);
    try {
      await requestMutualCancellation(cancelDialogRental.id, cancelReason.trim());
      toast.success("Cererea de anulare a fost trimisă chiriașului");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      setCancelDialogRental(null);
      setCancelReason("");
    } catch (e: any) {
      toast.error(e?.message || "Eroare la trimiterea cererii de anulare");
      console.error(e);
    } finally { setRespondingId(null); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">Niciun produs închiriat momentan</h3>
        <p className="mb-6 max-w-md text-muted-foreground">Când chiriașii vor rezerva produsele tale, vei vedea aici cererile și închirierile active.</p>
        <Button asChild>
          <Link to="/owner/new-product"><Plus className="mr-2 h-4 w-4" />{copy.dashboard.addListing}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Inbox className="h-4 w-4" /><span className="text-sm">Cereri noi</span></div>
          <p className="text-2xl font-bold text-foreground">{pendingRentals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Package className="h-4 w-4" /><span className="text-sm">Active</span></div>
          <p className="text-2xl font-bold text-foreground">{activeRentals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><XCircle className="h-4 w-4" /><span className="text-sm">Anulate</span></div>
          <p className="text-2xl font-bold text-foreground">{cancelledRentals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /><span className="text-sm">Câștig luna asta</span></div>
          <p className="text-2xl font-bold text-primary">{monthEarnings.toFixed(2)} RON</p>
        </div>
      </div>

      {/* Premium request cards */}
      {(pendingRentals.length > 0 || premiumActiveRentals.length > 0) && (
        <section>
          <h3 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Cereri de închiriere
            <Badge className="bg-primary text-primary-foreground">{pendingRentals.length + premiumActiveRentals.length}</Badge>
          </h3>
          <div className="space-y-4">
            {[...pendingRentals, ...premiumActiveRentals].map((rental) => {
              const isPending = rental.status === "pending";
              const canRequestCancel = !isPending && !rental.handover_confirmed_at;
              return (
                <div
                  key={rental.id}
                  className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 sm:p-6 shadow-lg shadow-primary/10"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {isPending ? (
                      <Badge className="bg-primary text-primary-foreground animate-pulse">Cerere nouă</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Confirmată</Badge>
                    )}
                  </div>

                  <div className="flex items-start gap-2 mb-1 pr-24 sm:pr-28">
                    <Inbox className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                        {isPending ? "Cerere de la" : "Rezervare confirmată cu"}
                      </p>
                      <p className="text-lg font-semibold text-foreground truncate">
                        {rental.renter_name || "Chiriaș"}
                      </p>
                    </div>
                  </div>

                  <p className="text-base font-medium text-foreground mt-2">
                    pentru <span className="text-primary">{rental.product_title}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="rounded-xl bg-card/80 border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3.5 w-3.5" /><span>Perioadă</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(rental.start_date), "d MMM", { locale: ro })} – {format(new Date(rental.end_date), "d MMM", { locale: ro })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-card/80 border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3.5 w-3.5" /><span>Zile</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{rental.rental_days}</p>
                    </div>
                    <div className="rounded-xl bg-primary/15 border border-primary/30 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-primary/80 mb-1">
                        <TrendingUp className="h-3.5 w-3.5" /><span>Câștig</span>
                      </div>
                      <p className="text-lg font-bold text-primary leading-tight">{rental.owner_payout} RON</p>
                    </div>
                  </div>

                  {rental.message_to_owner && rental.message_to_owner.trim().length > 0 && (
                    <div className="mt-4 rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Mesaj de la chiriaș</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {rental.message_to_owner}
                      </p>
                    </div>
                  )}

                  {isPending ? (
                    <div className="flex flex-col sm:flex-row gap-2 mt-5">
                      <Button
                        onClick={() => handleAccept(rental)}
                        disabled={respondingId === rental.id}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/90 shadow-md"
                      >
                        {respondingId === rental.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                        Acceptă
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejectDialogRental(rental)}
                        disabled={respondingId === rental.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />Refuză
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 mt-5">
                      <Button asChild className="flex-1">
                        <Link to={rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`}>
                          Vezi detalii <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}

                  {canRequestCancel && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelDialogRental(rental)}
                        disabled={respondingId === rental.id}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Solicită anularea cererii
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* History accordion (no images) */}
      {historyRentals.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Package className="h-5 w-5 text-primary" />
                Închirieri active &amp; istoric
                <Badge variant="secondary">{historyRentals.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="divide-y divide-border">
                {historyRentals.map((rental) => {
                  const to = rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`;
                  const allowed = ["pending", "accepted", "rejected", "completed", "cancelled", "active", "inactive"];
                  const statusKey = (allowed.includes(rental.status) ? rental.status : "pending") as any;
                  return (
                    <div key={rental.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{rental.product_title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          Chiriaș: <span className="text-foreground">{rental.renter_name || "—"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rental.start_date), "d MMM yyyy", { locale: ro })} – {format(new Date(rental.end_date), "d MMM yyyy", { locale: ro })} · {rental.rental_days} zile
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{rental.owner_payout} RON</p>
                          <StatusBadge status={statusKey} />
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link to={to}>
                            Vezi mai mult <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialogRental} onOpenChange={(open) => !open && setRejectDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuză cererea de închiriere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să refuzi cererea pentru „{rejectDialogRental?.product_title}"?</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motiv (opțional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogRental(null)}>Anulează</Button>
            <Button variant="destructive" onClick={handleReject} disabled={respondingId === rejectDialogRental?.id}>
              {respondingId === rejectDialogRental?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Refuză cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mutual cancel request dialog */}
      <Dialog open={!!cancelDialogRental} onOpenChange={(open) => !open && setCancelDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicită anularea cererii</DialogTitle>
            <DialogDescription>
              Trimitem o cerere de anulare către chiriaș pentru „{cancelDialogRental?.product_title}". Dacă acceptă, banii (inclusiv comisionul) îi sunt rambursați integral.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivul anulării (obligatoriu)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogRental(null)}>Renunță</Button>
            <Button
              variant="destructive"
              onClick={handleRequestCancel}
              disabled={respondingId === cancelDialogRental?.id}
            >
              {respondingId === cancelDialogRental?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Trimite cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalsOutTab;
