import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search, Receipt, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import StatusBadge from "./StatusBadge";
import { InspectionDialog } from "./InspectionDialog";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import RentalTimeline, { getTimelineStep } from "./RentalTimeline";
import type { InspectionPhase } from "@/features/rentals/inspectionApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RentalPaymentStatus from "@/components/admin/RentalPaymentStatus";
import { toast } from "sonner";
import MainActionCard from "./MainActionCard";
import SecondaryActionsMenu from "./SecondaryActionsMenu";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import LeaveReviewDialog, { type LeaveReviewRental } from "./LeaveReviewDialog";
import OpenDisputeDialog from "./OpenDisputeDialog";
import EarlyReturnRequestDialog from "@/components/rentals/EarlyReturnRequestDialog";

interface Rental {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string;
  owner_id: string | null;
  owner_name: string;
  start_date: string;
  start_date_raw: string;
  end_date: string;
  end_date_raw: string;
  subtotal: number;
  daily_price: number;
  platform_fee: number;
  status: string;
  payment_status?: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  dispute_status?: string | null;
  early_return_status?: string | null;
  location: string;
}

const fetchMyRentals = async (userId: string): Promise<Rental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, product_id, start_date, end_date, subtotal, daily_price, platform_fee, status, payment_status, handover_confirmed_at, return_confirmed_at, dispute_status, early_return_status, created_at, products(title, images, location_city, owner_id, profiles:owner_id(full_name))")
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
    start_date_raw: r.start_date,
    end_date: format(new Date(r.end_date), "dd MMM yyyy"),
    end_date_raw: r.end_date,
    subtotal: r.subtotal,
    daily_price: Number(r.daily_price) || 0,
    platform_fee: Number(r.platform_fee) || 0,
    status: r.status,
    payment_status: r.payment_status,
    handover_confirmed_at: r.handover_confirmed_at,
    return_confirmed_at: r.return_confirmed_at,
    dispute_status: r.dispute_status,
    early_return_status: r.early_return_status,
    location: r.products?.location_city || "",
  }));
};

const RentalsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inspectionRental, setInspectionRental] = useState<{ rental: Rental; phase: InspectionPhase } | null>(null);
  const [reviewRental, setReviewRental] = useState<LeaveReviewRental | null>(null);
  const [disputeRental, setDisputeRental] = useState<Rental | null>(null);

  useRentalRealtime(user?.id, "renter", [["my-rentals", user?.id], ["pv-progress"]]);

  const handleContactOwner = async (rental: Rental) => {
    if (!rental.id) return;
    const convId = await getOrCreateRentalConversation(rental.id);
    if (convId) navigate(`/mesaje?conv=${convId}`);
  };

  const cancelPaidMutation = useMutation({
    mutationFn: async (rental: Rental) => {
      const { data, error } = await supabase.functions.invoke("cancel-rental-by-renter", {
        body: { rental_id: rental.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { tier: string; refunded_amount: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-rentals"] });
      const tier = data?.tier;
      if (tier === "FREE") toast.success(copy.dashboard.cancelFullRefundSuccess);
      else if (tier === "LIMITED")
        toast.success(`${copy.dashboard.cancelPartialRefundSuccess} (${data?.refunded_amount ?? 0} RON)`);
      else toast.success(copy.dashboard.cancelNoRefundSuccess);
    },
    onError: () => toast.error(copy.dashboard.cancelPaidError),
  });

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: !!user?.id,
  });

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
    <div className="space-y-4">
      {rentals.map((rental) => {
        const tlRental = {
          status: rental.status,
          payment_status: rental.payment_status,
          start_date: rental.start_date_raw,
          end_date: rental.end_date_raw,
          handover_confirmed_at: rental.handover_confirmed_at,
          return_confirmed_at: rental.return_confirmed_at,
          dispute_status: (rental.dispute_status as any) ?? "none",
        };
        const { current: step, cancelled } = getTimelineStep(tlRental);
        const inspectionPhase: InspectionPhase = step >= 5 ? "checkin" : "checkout";

        return (
          <article key={rental.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={rental.product_image}
                alt={rental.product_title}
                className="w-full sm:w-20 h-32 sm:h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/produs/${rental.product_id}`} className="font-heading text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                    {rental.product_title}
                  </Link>
                  <StatusBadge status={rental.status as any} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{copy.dashboard.owner}: {rental.owner_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{rental.start_date} – {rental.end_date}</span>
                  {rental.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{rental.location}</span>}
                  <span className="font-semibold text-primary ml-auto">{rental.subtotal} RON</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-5">
              <RentalTimeline rental={tlRental} />
            </div>

            {/* Main action */}
            <div className="mt-4">
              <MainActionCard
                rental={{
                  id: rental.id,
                  product_id: rental.product_id,
                  product_title: rental.product_title,
                  start_date: rental.start_date_raw,
                  end_date: rental.end_date_raw,
                  status: rental.status,
                  payment_status: rental.payment_status,
                  handover_confirmed_at: rental.handover_confirmed_at,
                  return_confirmed_at: rental.return_confirmed_at,
                  dispute_status: (rental.dispute_status as any) ?? "none",
                }}
                step={step}
                cancelled={cancelled}
                role="renter"
                onStartInspection={() => setInspectionRental({ rental, phase: inspectionPhase })}
                onChat={() => handleContactOwner(rental)}
                onLeaveReview={() =>
                  setReviewRental({
                    id: rental.id,
                    product_id: rental.product_id,
                    product_title: rental.product_title,
                    counterparty_id: rental.owner_id,
                    counterparty_name: rental.owner_name,
                  })
                }
                secondaryActions={
                  <SecondaryActionsMenu
                    onCancel={
                      !rental.handover_confirmed_at && rental.status !== "completed" && rental.status !== "cancelled"
                        ? () => cancelPaidMutation.mutate(rental)
                        : undefined
                    }
                    onEarlyReturn={
                      rental.handover_confirmed_at && rental.status === "active" && rental.early_return_status === "none"
                        ? () => document.getElementById(`early-return-${rental.id}`)?.click()
                        : undefined
                    }
                    onReportIssue={step >= 3 && step <= 5 ? () => setDisputeRental(rental) : undefined}
                  />
                }
              />
            </div>

            {/* Hidden trigger for early return dialog (composed via menu) */}
            {rental.handover_confirmed_at && rental.status === "active" && rental.early_return_status === "none" && (
              <div className="hidden">
                <EarlyReturnRequestDialog
                  rentalId={rental.id}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["my-rentals"] })}
                  trigger={<button id={`early-return-${rental.id}`} type="button" />}
                />
              </div>
            )}

            {/* Payment status (collapsed) */}
            <Collapsible className="mt-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5 mr-1" />
                  Status plată
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <RentalPaymentStatus rentalId={rental.id} mode="user" />
              </CollapsibleContent>
            </Collapsible>
          </article>
        );
      })}

      {/* Dialogs */}
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
      {disputeRental && (
        <OpenDisputeDialog
          open={!!disputeRental}
          onOpenChange={(open) => !open && setDisputeRental(null)}
          rentalId={disputeRental.id}
          phase={disputeRental.handover_confirmed_at ? "return" : "handover"}
        />
      )}
      <LeaveReviewDialog
        open={!!reviewRental}
        onOpenChange={(open) => !open && setReviewRental(null)}
        rental={reviewRental}
        currentUserRole="renter"
      />
    </div>
  );
};

export default RentalsTab;
