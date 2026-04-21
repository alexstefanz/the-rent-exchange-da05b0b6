import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Eye, Edit, Check, X, Loader2, Calendar, MessageCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "./StatusBadge";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { getOwnerRentals, respondToRental, confirmHandover, confirmReturn, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AcceptedRentalDialog } from "./AcceptedRentalDialog";
import { InspectionDialog } from "./InspectionDialog";
import RentalTimeline from "./RentalTimeline";
import type { InspectionPhase } from "@/features/rentals/inspectionApi";

const statusLabels: Record<string, { ro: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { ro: "În așteptare", variant: "secondary" },
  confirmed: { ro: "Acceptată", variant: "default" },
  active: { ro: "Activă", variant: "default" },
  completed: { ro: "Finalizată", variant: "outline" },
  cancelled: { ro: "Anulată", variant: "destructive" },
  overdue: { ro: "Întârziată", variant: "destructive" },
};

const LendingsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const { data: products = [], isLoading: productsLoading } = useMyProducts(user?.id);
  const queryClient = useQueryClient();

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["ownerRentals", user?.id],
    queryFn: () => getOwnerRentals(user!.id),
    enabled: !!user?.id,
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectDialogRental, setRejectDialogRental] = useState<OwnerRental | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptedRental, setAcceptedRental] = useState<OwnerRental | null>(null);
  const [inspectionRental, setInspectionRental] = useState<{ rental: OwnerRental; phase: InspectionPhase } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const activeProducts = products.filter(p => p.is_active);
  const pendingRentals = rentals.filter(r => r.status === "pending");
  const otherRentals = rentals.filter(r => r.status !== "pending");

  const handleAccept = async (rental: OwnerRental) => {
    setRespondingId(rental.id);
    try {
      await respondToRental(rental.id, "accept");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      setAcceptedRental(rental);
    } catch (e) {
      toast.error("Eroare la acceptarea cererii");
      console.error(e);
    } finally {
      setRespondingId(null);
    }
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
    } catch (e) {
      toast.error("Eroare la refuzarea cererii");
      console.error(e);
    } finally {
      setRespondingId(null);
    }
  };

  const handleConfirmHandover = async (rental: OwnerRental) => {
    setConfirmingId(rental.id);
    try {
      await confirmHandover(rental.id);
      toast.success("Predarea a fost confirmată");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
    } catch (e) {
      toast.error("Eroare la confirmarea predării");
      console.error(e);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleConfirmReturn = async (rental: OwnerRental) => {
    setConfirmingId(rental.id);
    try {
      await confirmReturn(rental.id);
      toast.success("Returnare confirmată. Suma va apărea în balanță.");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
    } catch (e) {
      toast.error("Eroare la confirmarea returnării");
      console.error(e);
    } finally {
      setConfirmingId(null);
    }
  };

  const isLoading = productsLoading || rentalsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0 && rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noListings}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noListingsSubtitle}</p>
        <Button asChild>
          <Link to="/adauga-anunt">
            <Plus className="mr-2 h-4 w-4" />
            {copy.dashboard.startListing}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">{copy.dashboard.activeProducts}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeProducts.length}</p>
        </div>
        {pendingRentals.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Cereri noi</span>
            </div>
            <p className="text-2xl font-bold text-primary">{pendingRentals.length}</p>
          </div>
        )}
      </div>

      {/* Pending Rental Requests */}
      {pendingRentals.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cereri de închiriere
            <Badge variant="default">{pendingRentals.length}</Badge>
          </h3>
          <div className="space-y-4">
            {pendingRentals.map((rental) => (
              <RentalRequestCard
                key={rental.id}
                rental={rental}
                isResponding={respondingId === rental.id}
                onAccept={() => handleAccept(rental)}
                onReject={() => setRejectDialogRental(rental)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other Rentals */}
      {otherRentals.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
            Istoric închirieri
          </h3>
          <div className="space-y-3">
            {otherRentals.map((rental) => (
              <Card key={rental.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={rental.product_image || "/placeholder.svg"}
                      alt={rental.product_title}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-foreground truncate">{rental.product_title}</h4>
                        <Badge variant={statusLabels[rental.status]?.variant || "secondary"}>
                          {statusLabels[rental.status]?.ro || rental.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rental.renter_name || "Chiriaș"} · {format(new Date(rental.start_date), "d MMM", { locale: ro })} - {format(new Date(rental.end_date), "d MMM", { locale: ro })} · {rental.owner_payout} RON
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <RentalTimeline rental={{
                          status: rental.status,
                          payment_status: rental.payment_status,
                          end_date: rental.end_date,
                          handover_confirmed_at: rental.handover_confirmed_at,
                          return_confirmed_at: rental.return_confirmed_at,
                          refunded_at: rental.refunded_at,
                        }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(rental.status === "confirmed" || rental.status === "active") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectionRental({
                              rental,
                              phase: rental.status === "confirmed" ? "checkout" : "checkin",
                            })}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            📷 {rental.status === "confirmed" ? "Predare" : "Returnare"}
                          </Button>
                        )}
                        {rental.status === "confirmed" && rental.handover_confirmed_at == null && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmHandover(rental)}
                            disabled={confirmingId === rental.id}
                          >
                            {confirmingId === rental.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            {copy.timeline.confirmHandover}
                          </Button>
                        )}
                        {rental.status === "active" && rental.return_confirmed_at == null && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmReturn(rental)}
                            disabled={confirmingId === rental.id}
                          >
                            {confirmingId === rental.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            {copy.timeline.confirmReturn}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* My Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">{copy.dashboard.myItems}</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/adauga-anunt">
                <Plus className="mr-2 h-4 w-4" />
                {copy.dashboard.addListing}
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => {
              const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
              return (
                <div key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <img src={product.images?.[0] || "/placeholder.svg"} alt={product.title} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground truncate">{product.title}</h4>
                      <StatusBadge status={product.is_active ? "active" : "inactive"} size="sm" />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">{clientPrice} RON/{copy.common.perDay.replace("/ ", "")}</p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <Link to={getProductUrl(product)}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <Link to={`/owner/edit-product/${product.id}`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialogRental} onOpenChange={(open) => !open && setRejectDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuză cererea de închiriere</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să refuzi cererea pentru „{rejectDialogRental?.product_title}"?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motiv (opțional) - ex: produsul nu este disponibil în acea perioadă"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogRental(null)}>
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={respondingId === rejectDialogRental?.id}
            >
              {respondingId === rejectDialogRental?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Refuză cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accepted Rental Confirmation Dialog */}
      <AcceptedRentalDialog
        rental={acceptedRental}
        open={!!acceptedRental}
        onOpenChange={(open) => !open && setAcceptedRental(null)}
        onCancelled={() => {
          setAcceptedRental(null);
          queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
        }}
      />

      {/* Inspection Dialog */}
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
    </div>
  );
};

// Sub-component for pending rental request cards
function RentalRequestCard({
  rental,
  isResponding,
  onAccept,
  onReject,
}: {
  rental: OwnerRental;
  isResponding: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={rental.product_image || "/placeholder.svg"}
            alt={rental.product_title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-foreground">{rental.product_title}</h4>
              <Badge variant="secondary">În așteptare</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              De la: <span className="font-medium text-foreground">{rental.renter_name || "Chiriaș"}</span>
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Perioadă</span>
                <p className="font-medium">
                  {format(new Date(rental.start_date), "d MMM", { locale: ro })} - {format(new Date(rental.end_date), "d MMM", { locale: ro })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Zile</span>
                <p className="font-medium">{rental.rental_days}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vei primi</span>
                <p className="font-medium text-primary">{rental.owner_payout} RON</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={onAccept}
                disabled={isResponding}
                className="flex-1"
              >
                {isResponding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Acceptă
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isResponding}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Refuză
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LendingsTab;
