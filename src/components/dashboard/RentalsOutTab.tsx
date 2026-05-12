import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Check, X, Loader2, Calendar, TrendingUp, Inbox, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerRentals, respondToRental, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import RentalProductCard from "./RentalProductCard";

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
                    {rental.message_to_owner && rental.message_to_owner.trim().length > 0 && (
                      <div className="mt-3 rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Mesaj de la chiriaș</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {rental.message_to_owner}
                        </p>
                      </div>
                    )}
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

      {/* Active & history grid */}
      {otherRentals.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Închirieri active &amp; istoric
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherRentals.map((rental) => {
              const to = rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`;
              return (
                <RentalProductCard
                  key={rental.id}
                  to={to}
                  image={rental.product_image || "/placeholder.svg"}
                  title={rental.product_title}
                  startDate={format(new Date(rental.start_date), "d MMM", { locale: ro })}
                  endDate={format(new Date(rental.end_date), "d MMM", { locale: ro })}
                  status={rental.status}
                  amount={rental.owner_payout}
                  amountLabel="Câștig"
                />
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
    </div>
  );
};

export default RentalsOutTab;
