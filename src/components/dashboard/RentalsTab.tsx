import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search, Camera, AlertCircle, Receipt, ChevronDown, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import StatusBadge from "./StatusBadge";
import { InspectionDialog } from "./InspectionDialog";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import RentalTimeline, { getTimelineStep } from "./RentalTimeline";
import type { InspectionPhase } from "@/features/rentals/inspectionApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RentalPaymentStatus from "@/components/admin/RentalPaymentStatus";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Rental {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string;
  owner_id: string | null;
  owner_name: string;
  start_date: string;
  end_date: string;
  end_date_raw: string;
  subtotal: number;
  status: string;
  payment_status?: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  location: string;
}

const fetchMyRentals = async (userId: string): Promise<Rental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, product_id, start_date, end_date, subtotal, status, payment_status, handover_confirmed_at, return_confirmed_at, created_at, products(title, images, location_city, owner_id, profiles:owner_id(full_name))")
    .eq("renter_id", userId)
    .or("status.in.(confirmed,active,completed),and(status.eq.pending,payment_status.in.(authorized,paid))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    product_id: r.product_id,
    product_title: r.products?.title || "Produs șters",
    product_image: r.products?.images?.[0] || "/placeholder.svg",
    owner_id: r.products?.owner_id || null,
    owner_name: r.products?.profiles?.full_name || "Utilizator",
    start_date: format(new Date(r.start_date), "dd MMM yyyy"),
    end_date: format(new Date(r.end_date), "dd MMM yyyy"),
    end_date_raw: r.end_date,
    subtotal: r.subtotal,
    status: r.status,
    payment_status: r.payment_status,
    handover_confirmed_at: r.handover_confirmed_at,
    return_confirmed_at: r.return_confirmed_at,
    location: r.products?.location_city || "",
  }));
};

const RentalsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inspectionRental, setInspectionRental] = useState<{ rental: Rental; phase: InspectionPhase } | null>(null);

  const handleContactOwner = async (rental: Rental) => {
    if (!rental.id) return;
    const convId = await getOrCreateRentalConversation(rental.id);
    if (convId) {
      navigate(`/mesaje?conv=${convId}`);
    }
  };

  const cancelPaidMutation = useMutation({
    mutationFn: async (rental: Rental) => {
      // Mark rental as cancelled (RLS allows renter to cancel own pending rentals)
      const { error } = await supabase
        .from("rentals")
        .update({
          status: "cancelled",
          cancellation_reason: "renter_cancelled_after_payment",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", rental.id);
      if (error) throw error;

      // Notify owner (non-blocking)
      supabase.functions
        .invoke("send-cancellation-notification", { body: { rental_id: rental.id } })
        .catch((e) => console.error("Cancellation notification error:", e));

      // Create admin ticket so the team releases the Stripe hold
      supabase.functions
        .invoke("create-renter-cancellation-ticket", { body: { rental_id: rental.id } })
        .catch((e) => console.error("Cancellation ticket error:", e));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success(copy.dashboard.cancelPaidSuccess);
    },
    onError: () => {
      toast.error(copy.dashboard.cancelPaidError);
    },
  });

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: !!user?.id,
  });

  // Find rentals with renter checkin inspection already uploaded
  const rentalIds = rentals.map(r => r.id);
  const { data: renterCheckinIds = new Set<string>() } = useQuery({
    queryKey: ["my-renter-checkin-inspections", user?.id, rentalIds],
    queryFn: async () => {
      if (!user?.id || rentalIds.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("rental_inspections")
        .select("rental_id")
        .in("rental_id", rentalIds)
        .eq("phase", "checkin")
        .eq("role", "renter")
        .eq("user_id", user.id);
      if (error) return new Set<string>();
      return new Set((data || []).map((r: any) => r.rental_id as string));
    },
    enabled: !!user?.id && rentalIds.length > 0,
  });

  const activeRentals = rentals.filter(r => r.status === "confirmed" || r.status === "active");
  // completed rentals where renter hasn't yet documented hand-back stay actionable
  const completedAwaitingCheckin = rentals.filter(
    r => r.status === "completed" && !renterCheckinIds.has(r.id)
  );
  const completedRentals = rentals.filter(
    r => r.status === "completed" && renterCheckinIds.has(r.id)
  );
  const awaitingOwnerRentals = rentals.filter(
    r => r.status === "pending" && (r.payment_status === "authorized" || r.payment_status === "paid")
  );

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
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noRentals}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noRentalsSubtitle}</p>
        <Button asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {copy.dashboard.startSearching}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {awaitingOwnerRentals.length > 0 && (
        <section>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Plata a fost autorizată</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Suma este blocată în siguranță. Așteptăm răspunsul proprietarului în maxim 24h.
              </p>
            </div>
          </div>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            În așteptarea proprietarului
          </h3>
          <div className="space-y-4">
            {awaitingOwnerRentals.map((rental) => (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/produs/${rental.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{rental.product_title}</Link>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Proprietar: {rental.owner_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                    {rental.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{rental.location}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-primary">{rental.subtotal} RON</span>
                    <div className="flex flex-wrap gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={cancelPaidMutation.isPending}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            {copy.dashboard.cancelRequest}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{copy.dashboard.cancelPaidTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {copy.dashboard.cancelPaidConfirm}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{copy.dashboard.keepRequest}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelPaidMutation.mutate(rental)}>
                              {copy.dashboard.confirmCancel}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" size="sm" onClick={() => handleContactOwner(rental)}>
                        {copy.dashboard.contactOwner}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{copy.dashboard.upcomingRentals}</h3>
          <div className="space-y-4">
            {activeRentals.map((rental) => {
              const tlRental = {
                status: rental.status,
                payment_status: rental.payment_status,
                end_date: rental.end_date_raw,
                handover_confirmed_at: rental.handover_confirmed_at,
                return_confirmed_at: rental.return_confirmed_at,
              };
              const step = getTimelineStep(tlRental).current;
              return (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/produs/${rental.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{rental.product_title}</Link>
                    <StatusBadge status={rental.status as any} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.dashboard.owner}: {rental.owner_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                    {rental.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{rental.location}</span>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <RentalTimeline rental={tlRental} />
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        Status plată
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <RentalPaymentStatus rentalId={rental.id} mode="user" />
                    </CollapsibleContent>
                  </Collapsible>
                  {step === 5 && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground">{copy.timeline.returnReminder}</p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-primary">{rental.subtotal} RON</span>
                    <div className="flex gap-2">
                      {rental.status === "confirmed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectionRental({ rental, phase: "checkout" })}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          📷 {copy.inspection.pickup}
                        </Button>
                      )}
                      {rental.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectionRental({ rental, phase: "checkin" })}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          📷 {copy.inspection.confirmHandedBack}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleContactOwner(rental)}>
                        {copy.dashboard.contactOwner}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {completedAwaitingCheckin.length > 0 && (
        <section>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <Camera className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Confirmă cu poză starea în care ai predat produsul</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Închirierea s-a încheiat. Adaugă poze ca dovadă vizuală că l-ai returnat în starea convenită.
              </p>
            </div>
          </div>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            De confirmat predarea
          </h3>
          <div className="space-y-4">
            {completedAwaitingCheckin.map((rental) => (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-primary/30 bg-card p-4 transition-shadow hover:shadow-md">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/produs/${rental.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{rental.product_title}</Link>
                    <StatusBadge status={rental.status as any} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.dashboard.owner}: {rental.owner_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                    {rental.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{rental.location}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-primary">{rental.subtotal} RON</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setInspectionRental({ rental, phase: "checkin" })}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        📷 {copy.inspection.confirmHandedBack}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleContactOwner(rental)}>
                        {copy.dashboard.contactOwner}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{copy.dashboard.rentalHistory}</h3>
          <div className="space-y-4">
            {completedRentals.map((rental) => (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 opacity-75">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{rental.product_title}</span>
                    <StatusBadge status={rental.status as any} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <RentalTimeline rental={{
                      status: rental.status,
                      payment_status: rental.payment_status,
                      end_date: rental.end_date_raw,
                      handover_confirmed_at: rental.handover_confirmed_at,
                      return_confirmed_at: rental.return_confirmed_at,
                    }} />
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        Status plată
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <RentalPaymentStatus rentalId={rental.id} mode="user" />
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="mt-3">
                    <span className="font-semibold text-muted-foreground">{rental.subtotal} RON</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inspection Dialog */}
      {inspectionRental && (
        <InspectionDialog
          open={!!inspectionRental}
          onOpenChange={(open) => !open && setInspectionRental(null)}
          rentalId={inspectionRental.rental.id}
          phase={inspectionRental.phase}
          role="renter"
          productTitle={inspectionRental.rental.product_title}
        />
      )}
    </div>
  );
};

export default RentalsTab;
