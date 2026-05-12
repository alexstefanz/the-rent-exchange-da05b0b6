import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Plus, Check, X, Loader2, Calendar, MapPin, Receipt, ChevronDown, TrendingUp, Inbox, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerRentals, respondToRental, confirmHandover, confirmReturn, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcceptedRentalDialog } from "./AcceptedRentalDialog";
import { InspectionDialog } from "./InspectionDialog";
import LeaveReviewDialog, { type LeaveReviewRental } from "./LeaveReviewDialog";
import RentalTimeline, { getTimelineStep } from "./RentalTimeline";
import MainActionCard from "./MainActionCard";
import SecondaryActionsMenu from "./SecondaryActionsMenu";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import type { InspectionPhase } from "@/features/rentals/inspectionApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RentalPaymentStatus from "@/components/admin/RentalPaymentStatus";
import PayoutStatusBadge from "./PayoutStatusBadge";
import StatusBadge from "./StatusBadge";

const RentalsOutTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useRentalRealtime(user?.id, "owner", [["ownerRentals", user?.id], ["pv-progress"]]);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["ownerRentals", user?.id],
    queryFn: () => getOwnerRentals(user!.id),
    enabled: !!user?.id,
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectDialogRental, setRejectDialogRental] = useState<OwnerRental | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptedRental, setAcceptedRental] = useState<OwnerRental | null>(null);
  const [inspectionRental, setInspectionRental] = useState<{ rental: OwnerRental; phase: InspectionPhase } | null>(null);
  const [reviewRental, setReviewRental] = useState<LeaveReviewRental | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const pendingRentals = rentals.filter(r => r.status === "pending");
  const otherRentals = rentals.filter(r => r.status !== "pending");
  const activeRentals = rentals.filter(r => r.status === "confirmed" || r.status === "active");

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
      setAcceptedRental(rental);
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

  const handleConfirmHandover = async (rental: OwnerRental) => {
    setConfirmingId(rental.id);
    try {
      await confirmHandover(rental.id);
      toast.success("Predarea a fost confirmată");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
    } catch (e: any) { toast.error(e?.message || "Eroare la confirmarea predării"); }
    finally { setConfirmingId(null); }
  };

  const handleConfirmReturn = async (rental: OwnerRental) => {
    setConfirmingId(rental.id);
    try {
      await confirmReturn(rental.id);
      toast.success("Returnare confirmată. Suma va apărea în balanță.");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
    } catch (e: any) { toast.error(e?.message || "Eroare la confirmarea returnării"); }
    finally { setConfirmingId(null); }
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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Inbox className="h-4 w-4" /><span className="text-sm">Cereri noi</span></div>
          <p className="text-2xl font-bold text-foreground">{pendingRentals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Package className="h-4 w-4" /><span className="text-sm">Active</span></div>
          <p className="text-2xl font-bold text-foreground">{activeRentals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /><span className="text-sm">Câștig luna asta</span></div>
          <p className="text-2xl font-bold text-primary">{monthEarnings.toFixed(2)} RON</p>
        </div>
      </div>

      {/* Pending requests */}
      {pendingRentals.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cereri de închiriere
            <Badge variant="default">{pendingRentals.length}</Badge>
          </h3>
          <div className="space-y-3">
            {pendingRentals.map((rental) => (
              <div key={rental.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-4">
                  <img src={rental.product_image || "/placeholder.svg"} alt={rental.product_title} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-foreground">{rental.product_title}</h4>
                      <Badge variant="secondary">În așteptare</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">De la: <span className="font-medium text-foreground">{rental.renter_name || "Chiriaș"}</span></p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div><span className="text-muted-foreground">Perioadă</span><p className="font-medium">{format(new Date(rental.start_date), "d MMM", { locale: ro })} – {format(new Date(rental.end_date), "d MMM", { locale: ro })}</p></div>
                      <div><span className="text-muted-foreground">Zile</span><p className="font-medium">{rental.rental_days}</p></div>
                      <div><span className="text-muted-foreground">Câștig</span><p className="font-medium text-primary">{rental.owner_payout} RON</p></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => handleAccept(rental)} disabled={respondingId === rental.id} className="flex-1">
                        {respondingId === rental.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                        Acceptă
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectDialogRental(rental)} disabled={respondingId === rental.id} className="flex-1">
                        <X className="h-4 w-4 mr-1" />Refuză
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active & history */}
      {otherRentals.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Închirieri active &amp; istoric
          </h3>
          <div className="space-y-4">
            {otherRentals.map((rental) => {
              const tlRental = {
                status: rental.status,
                payment_status: rental.payment_status,
                start_date: rental.start_date,
                end_date: rental.end_date,
                handover_confirmed_at: rental.handover_confirmed_at,
                return_confirmed_at: rental.return_confirmed_at,
                refunded_at: rental.refunded_at,
                dispute_status: (rental.dispute_status as any) ?? "none",
              };
              const { current: step, cancelled } = getTimelineStep(tlRental);
              const inspectionPhase: InspectionPhase = step >= 5 ? "checkin" : "checkout";

              return (
                <article key={rental.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img src={rental.product_image || "/placeholder.svg"} alt={rental.product_title} className="w-full sm:w-20 h-32 sm:h-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-heading text-base font-semibold text-foreground line-clamp-1">{rental.product_title}</h4>
                        <StatusBadge status={rental.status as any} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Chiriaș: {rental.renter_name || "—"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(rental.start_date), "d MMM", { locale: ro })} – {format(new Date(rental.end_date), "d MMM", { locale: ro })}</span>
                        <span className="font-semibold text-primary ml-auto">Câștig: {rental.owner_payout} RON</span>
                      </div>
                      <div className="mt-2"><PayoutStatusBadge paymentStatus={rental.payment_status} rentalStatus={rental.status} amount={rental.owner_payout} /></div>
                      {rental.public_id && (
                        <Link to={`/inchirieri/${rental.public_id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />Vezi detalii · {rental.public_id}
                        </Link>
                      )}
                      {rental.public_id && (step === 3 || step === 4 || step === 5) && (rental.payment_status === "authorized" || rental.payment_status === "paid" || rental.payment_status === "captured") && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Link to={`/inchirieri/${rental.public_id}?pv=handover`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted">
                            PV Predare
                          </Link>
                          {step >= 5 && (
                            <Link to={`/inchirieri/${rental.public_id}?pv=return`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted">
                              PV Returnare
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5"><RentalTimeline rental={tlRental} /></div>

                  <div className="mt-4">
                    <MainActionCard
                      rental={{
                        id: rental.id,
                        product_id: rental.product_id,
                        product_title: rental.product_title,
                        start_date: rental.start_date,
                        end_date: rental.end_date,
                        status: rental.status,
                        payment_status: rental.payment_status,
                        handover_confirmed_at: rental.handover_confirmed_at,
                        return_confirmed_at: rental.return_confirmed_at,
                        dispute_status: (rental.dispute_status as any) ?? "none",
                      }}
                      step={step}
                      cancelled={cancelled}
                      role="owner"
                      isConfirming={confirmingId === rental.id}
                      onStartInspection={() => setInspectionRental({ rental, phase: inspectionPhase })}
                      onConfirmHandover={() => handleConfirmHandover(rental)}
                      onConfirmReturn={() => handleConfirmReturn(rental)}
                      onChat={() => navigate("/mesaje")}
                      onLeaveReview={() =>
                        setReviewRental({
                          id: rental.id,
                          product_id: rental.product_id,
                          product_title: rental.product_title,
                          counterparty_id: rental.renter_id,
                          counterparty_name: rental.renter_name || "Chiriaș",
                        })
                      }
                      secondaryActions={
                        <SecondaryActionsMenu />
                      }
                    />
                  </div>

                  <Collapsible className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                        <Receipt className="h-3.5 w-3.5 mr-1" />Status plată<ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <RentalPaymentStatus rentalId={rental.id} mode="user" />
                    </CollapsibleContent>
                  </Collapsible>
                </article>
              );
            })}
          </div>
        </section>
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

      <AcceptedRentalDialog
        rental={acceptedRental}
        open={!!acceptedRental}
        onOpenChange={(open) => !open && setAcceptedRental(null)}
        onCancelled={() => { setAcceptedRental(null); queryClient.invalidateQueries({ queryKey: ["ownerRentals"] }); }}
      />

      {inspectionRental && (
        <InspectionDialog
          open={!!inspectionRental}
          onOpenChange={(open) => !open && setInspectionRental(null)}
          rentalId={inspectionRental.rental.id}
          phase={inspectionRental.phase}
          role="owner"
          productTitle={inspectionRental.rental.product_title}
        />
      )}
      <LeaveReviewDialog
        open={!!reviewRental}
        onOpenChange={(open) => !open && setReviewRental(null)}
        rental={reviewRental}
        currentUserRole="owner"
      />
    </div>
  );
};

export default RentalsOutTab;
