import Confetti from "@/components/common/Confetti";
import ReceiptLink from "@/components/rentals/ReceiptLink";
import WalletPaymentSuccessModal from "@/components/rentals/WalletPaymentSuccessModal";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, MessageSquare, FileSignature, Loader2, Package, ShieldX, ExternalLink, Phone, Mail, CreditCard, Lock, CheckCircle2, Clock, Star, FlaskConical, Wallet, Check, X, MessageCircle, RotateCcw, PackageOpen, ChevronDown, CalendarClock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import RentalTimeline, { getTimelineStep } from "@/components/dashboard/RentalTimeline";
import StatusBadge from "@/components/dashboard/StatusBadge";
import RentalPaymentStatus from "@/components/admin/RentalPaymentStatus";
import { getRentalFullDetail, getReturnInitiated, initiateReturn } from "@/features/rentals/rentalDetailPageApi";
import MutualCancellationCard from "@/components/rentals/MutualCancellationCard";
import PvSignatureDialog from "@/components/rentals/PvSignatureDialog";
import PvPhotoUploadCard from "@/components/rentals/PvPhotoUploadCard";
import ReturnCountdownBadge from "@/components/rentals/ReturnCountdownBadge";
import LeaveReviewDialog from "@/components/dashboard/LeaveReviewDialog";
import EarlyReturnCard from "@/components/rentals/EarlyReturnCard";
import MeetingDetailsCard from "@/components/rentals/MeetingDetailsCard";
import RentalDocumentsModal from "@/components/rentals/RentalDocumentsModal";
import RentalExtensionCard from "@/components/rentals/RentalExtensionCard";
import HandoverPvCard from "@/components/rentals/HandoverPvCard";
import PhysicalPvUpload from "@/components/rentals/PhysicalPvUpload";
import ContractAcceptanceBlock from "@/components/rentals/ContractAcceptanceBlock";
import { useContractAcceptance } from "@/components/rentals/useContractAcceptance";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";

import { payForConfirmedRental, payRentalWithWallet } from "@/features/rentals/rentalsApi";
import { respondToRental } from "@/features/rentals/ownerRentalsApi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { toast } from "@/components/ui/sonner";
import { notify, notifyError } from "@/lib/notify";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import OpenDisputeDialog from "@/components/dashboard/OpenDisputeDialog";

const RentalDetailPage = () => {
  usePageSeo({ title: "Detalii rezervare — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const { publicId } = useParams<{ publicId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (r: string, e: string) => (language === "ro" ? r : e);
  const [pvOpen, setPvOpen] = useState<null | "handover" | "return">(null);
  const [paying, setPaying] = useState(false);
  const [payingTest, setPayingTest] = useState(false);
  const [payingWallet, setPayingWallet] = useState(false);
  const [walletSuccessOpen, setWalletSuccessOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [initiatingReturn, setInitiatingReturn] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<"contract" | "anexa1" | "anexa2" | "anexa3">("contract");
  const [docsBlank, setDocsBlank] = useState(false);
  const [pvSectionOpen, setPvSectionOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: wallet, refetch: refetchWallet } = useWalletBalance();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: rental, isLoading, error, refetch } = useQuery({
    queryKey: ["rental-detail", publicId],
    queryFn: () => getRentalFullDetail(publicId!),
    enabled: !!publicId && !!user?.id,
  });
  const contractAcc = useContractAcceptance(rental?.id);

  const { data: returnInitiated = false, refetch: refetchReturnInitiated } = useQuery({
    queryKey: ["return-initiated", rental?.id],
    queryFn: () => getReturnInitiated(rental!.id),
    enabled: !!rental?.id,
  });

  // Did the current user already review this rental? Hides the review CTA afterwards.
  const { data: alreadyReviewed = false, refetch: refetchReview } = useQuery({
    queryKey: ["rental-review-left", rental?.id, user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_reviews")
        .select("id", { count: "exact", head: true })
        .eq("rental_id", rental!.id)
        .eq("reviewer_id", user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!rental?.id && !!user?.id,
  });

  // Realtime: refetch rental detail on rentals + rental_pv_documents changes.
  useEffect(() => {
    if (!rental?.id || !publicId) return;
    const channel = supabase
      .channel(`rental-detail-rt-${rental.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `id=eq.${rental.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] });
          queryClient.invalidateQueries({ queryKey: ["rental-meeting", rental.id] });
          queryClient.invalidateQueries({ queryKey: ["rental-pickup-agreed", rental.id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_pv_documents", filter: `rental_id=eq.${rental.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] });
          queryClient.invalidateQueries({ queryKey: ["return-initiated", rental.id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_inspections", filter: `rental_id=eq.${rental.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rental?.id, publicId, queryClient]);

  const isOwnerEarly = rental?.owner_id === user?.id;
  const tlRentalEarly = rental ? {
    status: rental.status,
    payment_status: rental.payment_status,
    start_date: rental.start_date,
    end_date: rental.end_date,
    handover_confirmed_at: rental.handover_confirmed_at,
    return_confirmed_at: rental.return_confirmed_at,
    handover_pv_signed: !!(rental.handover_pv_owner_signed_at && rental.handover_pv_renter_signed_at),
    return_pv_renter_signed: !!rental.return_pv_renter_signed_at,
    return_pv_owner_signed: !!rental.return_pv_owner_signed_at,
    contract_signed: contractAcc.bothAccepted,
  } : null;
  const stepEarly = tlRentalEarly ? getTimelineStep(tlRentalEarly).current : 0;
  const isPaidEarly = !!rental && (rental.payment_status === "authorized" || rental.payment_status === "paid" || rental.payment_status === "captured");
  // Both PVs are always visible once the rental is paid; activation/locking is handled inside the panels.
  const showHandoverPvEarly = isPaidEarly && stepEarly >= 3;
  const showReturnPvEarly = isPaidEarly && stepEarly >= 3 && returnInitiated;
  // Done = digital PV signed by both, OR a physical PV validated by admin (server sets *_confirmed_at).
  const handoverDoneEarly = !!(rental?.handover_pv_owner_signed_at && rental?.handover_pv_renter_signed_at) || !!rental?.handover_confirmed_at;
  const returnDoneEarly = !!(rental?.return_pv_owner_signed_at && rental?.return_pv_renter_signed_at) || !!rental?.return_confirmed_at;
  const handoverIsCurrent = isPaidEarly && !handoverDoneEarly;
  const returnIsCurrent = handoverDoneEarly && !returnDoneEarly;

  const { data: pickupAgreed = false } = useQuery({
    queryKey: ["rental-pickup-agreed", rental?.id],
    queryFn: async () => {
      const { data } = await supabase.from("rentals").select("pickup_agreed_at").eq("id", rental!.id).maybeSingle();
      return !!(data as any)?.pickup_agreed_at;
    },
    enabled: !!rental?.id && isPaidEarly,
    refetchInterval: (q) => (q.state.data ? false : 8000),
  });
  const p1Current = !rental ? 0 : rental.status === "pending" ? 0 : !isPaidEarly ? 1 : 2;
  const p1Done = isPaidEarly && (pickupAgreed || handoverDoneEarly);
  const p2Unlocked = isPaidEarly && (pickupAgreed || handoverDoneEarly) && rental?.status !== "cancelled" && rental?.status !== "rejected";
  const p2Done = returnDoneEarly || rental?.status === "completed";
  const p2Current = p2Done ? 4 : returnInitiated ? 3 : handoverDoneEarly ? 2 : 0;

  const [expandP1] = useState(0);
  const [expandP2] = useState(0);

  // Deep-link: ?pv=handover|return auto-opens dialog when allowed
  useEffect(() => {
    if (!rental) return;
    const pv = searchParams.get("pv");
    if (pv === "handover" && showHandoverPvEarly) setPvOpen("handover");
    else if (pv === "return" && showReturnPvEarly) setPvOpen("return");
    if (pv) {
      const next = new URLSearchParams(searchParams);
      next.delete("pv");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rental?.id, showHandoverPvEarly, showReturnPvEarly]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-8 pt-24 lg:pt-8">
          <div className="max-w-md mx-auto text-center py-16">
            <ShieldX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h1 className="text-xl font-semibold">{t("Inchiriere negasita", "Rental not found")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("Nu ai acces la aceasta inchiriere sau codul este gresit.", "You don't have access or the code is wrong.")}</p>
            <Button asChild className="mt-4"><Link to="/profile">{t("Inapoi la cont", "Back to account")}</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = rental.owner_id === user?.id;
  const role: "owner" | "renter" = isOwner ? "owner" : "renter";
  const tlRental = {
    status: rental.status,
    payment_status: rental.payment_status,
    start_date: rental.start_date,
    end_date: rental.end_date,
    handover_confirmed_at: rental.handover_confirmed_at,
    return_confirmed_at: rental.return_confirmed_at,
    handover_pv_signed: !!(rental.handover_pv_owner_signed_at && rental.handover_pv_renter_signed_at),
    return_pv_renter_signed: !!rental.return_pv_renter_signed_at,
    return_pv_owner_signed: !!rental.return_pv_owner_signed_at,
    contract_signed: contractAcc.bothAccepted,
  };
  const { current: step, cancelled } = getTimelineStep(tlRental);
  const isClosedEarly = (rental.status === "cancelled" || rental.status === "rejected") && !rental.handover_confirmed_at;
  const disputeOpen = rental.dispute_status === "open";
  const disputePhase: "handover" | "return" = rental.handover_confirmed_at ? "return" : "handover";
  const disputePhaseLabel = ((rental as any).dispute_phase ?? disputePhase) === "return" ? t("faza de returnare", "return phase") : t("faza de predare", "handover phase");
  const canOpenDispute = !disputeOpen && !cancelled && rental.payment_status === "paid"
    && !["completed", "cancelled", "rejected"].includes(rental.status) && !rental.return_confirmed_at;

  const counterparty = isOwner
    ? { name: rental.renter_name, email: rental.renter_email, phone: rental.renter_phone, label: t("Chirias", "Renter") }
    : { name: rental.owner_name, email: rental.owner_email, phone: rental.owner_phone, label: t("Proprietar", "Owner") };

  const showHandoverPv = showHandoverPvEarly;
  const showReturnPv = showReturnPvEarly;

  async function handleChat() {
    const convId = await getOrCreateRentalConversation(rental.id);
    if (convId) {
      navigate(`/mesaje?conv=${convId}`, {
        state: { returnTo: { pathname: window.location.pathname, search: window.location.search } },
      });
    } else {
      toast.error(t("Nu am putut deschide conversația.", "Could not open conversation."));
    }
  }

  const isRejected = rental.status === "rejected" || (rental.status === "cancelled" && !!rental.rejection_reason);
  const needsPayment = !isOwner && rental.status === "confirmed" && rental.payment_status === "pending";
  // Renter always pays subtotal + platform fee (card and wallet alike).
  const payableTotal = Math.round((Number(rental.subtotal || 0) + Number(rental.platform_fee || 0)) * 100) / 100;

  async function handlePay() {
    if (paying) return;
    setPaying(true);
    try {
      const url = await payForConfirmedRental(rental.id);
      window.location.href = url;
    } catch (e: any) {
      console.error("payForConfirmedRental error:", e);
      toast.error(e?.message || t("Eroare la inițierea plății.", "Error initiating payment."));
      setPaying(false);
    }
  }

  async function handlePayWithWallet() {
    if (payingWallet) return;
    setPayingWallet(true);
    try {
      await payRentalWithWallet(rental.id);
      setWalletSuccessOpen(true);
      await Promise.all([refetch(), refetchWallet()]);
      setPayingWallet(false);
    } catch (e: any) {
      console.error("payRentalWithWallet error:", e);
      const msg = String(e?.message || "");
      if (msg.includes("insufficient_wallet_balance")) {
        toast.error(t("Sold insuficient în wallet.", "Insufficient wallet balance."));
      } else if (msg.includes("already_paid")) {
        toast.error(t("Rezervarea este deja plătită.", "Booking already paid."));
      } else {
        toast.error(t("Eroare la plata din wallet.", "Wallet payment error."));
      }
      setPayingWallet(false);
    }
  }

  async function handleAccept() {
    if (responding) return;
    setResponding(true);
    try {
      await respondToRental(rental!.id, "accept");
      toast.success(t("Cerere acceptată. Așteptăm plata chiriașului.", "Request accepted. Waiting for renter payment."));
      await refetch();
    } catch (e: any) {
      console.error("accept rental error:", e);
      toast.error(e?.message || t("Eroare la acceptarea cererii.", "Error accepting the request."));
    } finally {
      setResponding(false);
    }
  }

  async function handleReject() {
    if (responding) return;
    setResponding(true);
    try {
      await respondToRental(rental!.id, "reject", rejectReason || undefined);
      toast.success(t("Cererea a fost refuzată.", "Request rejected."));
      setRejectOpen(false);
      setRejectReason("");
      await refetch();
    } catch (e: any) {
      console.error("reject rental error:", e);
      toast.error(e?.message || t("Eroare la refuzarea cererii.", "Error rejecting the request."));
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <WalletPaymentSuccessModal
        open={walletSuccessOpen}
        onOpenChange={setWalletSuccessOpen}
        rentalId={rental.id}
        publicId={rental.public_id}
        productTitle={rental.product_title}
        productImage={rental.product_image}
        period={`${format(new Date(rental.start_date), "d MMM", { locale: roLocale })} – ${format(new Date(rental.end_date), "d MMM yyyy", { locale: roLocale })}`}
        rentalDays={rental.rental_days}
        handoverDate={format(new Date(rental.start_date), "EEEE, d MMMM yyyy", { locale: roLocale })}
        total={payableTotal}
        onContinue={() => { setWalletSuccessOpen(false); setTimeout(() => document.getElementById("rental-progress")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150); }}
        onChat={() => { setWalletSuccessOpen(false); handleChat(); }}
        t={t}
      />
      <main className="flex-1 container py-8 pt-24 lg:pt-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(isOwner ? "/inchirieri" : "/rezervari")}>
          <ArrowLeft className="h-4 w-4 mr-1" />{t("Inapoi la lista", "Back to list")}
        </Button>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-4 min-w-0">
            {rental.product_image && (
              <img
                src={rental.product_image}
                alt={rental.product_title || ""}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-mono text-muted-foreground">{rental.public_id}</p>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {role === "owner" ? t("Tu esti proprietar", "You are owner") : t("Tu esti chirias", "You are renter")}
                </span>
                {(rental.status === "cancelled" || rental.status === "rejected") && (
                  <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    {rental.status === "rejected" ? t("Refuzată", "Rejected") : t("Anulată", "Cancelled")}
                  </span>
                )}
              </div>
              <h1 className="font-bold tracking-tight mt-1 text-lg sm:text-2xl">
                {t("Inchiriere", "Rental")} — {rental.product_title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {format(new Date(rental.start_date), "d MMM yyyy", { locale: roLocale })} – {format(new Date(rental.end_date), "d MMM yyyy", { locale: roLocale })} · {rental.rental_days} {t("zile", "days")}
                </span>
                <ReturnCountdownBadge
                  startDate={rental.start_date}
                  endDate={rental.end_date}
                  hidden={returnDoneEarly || rental.status === "completed" || rental.status === "cancelled"}
                />
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
          <div id="rental-progress" className="scroll-mt-24"><RentalTimeline rental={tlRental} /></div>
        </section>

        {disputeOpen && (
          <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-destructive">
                  {t("Dispută deschisă", "Dispute open")} — {disputePhaseLabel}
                </p>
                <p className="text-sm text-foreground/80 mt-1">
                  {t("Echipa Rentli analizează cazul. Semnăturile și acțiunile sunt suspendate temporar.", "The Rentli team is reviewing the case. Signatures and actions are temporarily suspended.")}
                </p>
                {(rental as any).dispute_reason && (
                  <p className="text-sm mt-2 rounded-lg bg-card border border-border p-3 whitespace-pre-wrap break-words">
                    {(rental as any).dispute_reason}
                  </p>
                )}
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/suport")}>
                  {t("Contactează asistența", "Contact support")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {(rental.status === "cancelled" || rental.status === "rejected") && (() => {
          const reason = (rental as any).cancellation_reason as string | null | undefined;
          const wasPaid = ["authorized", "paid", "captured"].includes(String(rental.payment_status));
          const byOwner = reason === "owner_self_unpaid" || rental.status === "rejected";
          const byRenter = reason === "renter_self_unpaid";
          const who = byOwner
            ? (isOwner ? t("Ai anulat această rezervare", "You cancelled this reservation") : t("Rezervarea a fost anulată de proprietar", "The reservation was cancelled by the owner"))
            : byRenter
            ? (isOwner ? t("Rezervarea a fost anulată de chiriaș", "The reservation was cancelled by the renter") : t("Ai anulat această rezervare", "You cancelled this reservation"))
            : t("Rezervarea a fost anulată", "The reservation was cancelled");
          return (
            <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 mb-6">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-destructive">
                    {rental.status === "rejected" ? t("Cerere refuzată", "Request rejected") : t("Rezervare anulată", "Reservation cancelled")}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {who}{!wasPaid ? t(" înainte de efectuarea plății.", " before payment.") : "."}
                    {rental.cancelled_at && ` ${t("Data", "Date")}: ${format(new Date(rental.cancelled_at), "d MMM yyyy, HH:mm", { locale: roLocale })}.`}
                  </p>
                  {!isOwner && (
                    <p className="text-sm text-foreground/80 mt-1">
                      {wasPaid
                        ? t("Suma reținută este eliberată automat în metoda ta de plată.", "The held amount is released automatically to your payment method.")
                        : t("Nu ai fost taxat. Nicio sumă nu a fost retrasă.", "You were not charged.")}
                    </p>
                  )}
                </div>
              </div>
            </section>
          );
        })()}





        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
        {rental.status === "confirmed" && rental.payment_status === "pending" && (
          <Confetti onceKey={`approved-${rental.id}-${user?.id}`} />
        )}
        {rental.status === "completed" && <Confetti onceKey={`completed-${rental.id}-${user?.id}`} />}
        {rental.status === "completed" && (
          <section className="rounded-2xl border-2 border-primary bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center"><FileSignature className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-semibold text-sm">{t("Dosarul complet al închirierii", "Complete rental file")}</p>
                <p className="text-xs text-muted-foreground">{t("Contractul și toate anexele semnate, într-un singur PDF.", "Contract and all signed annexes in one PDF.")}</p>
              </div>
            </div>
            <Button className="shrink-0" onClick={() => { setDocsBlank(false); setDocsTab("contract"); setDocsOpen(true); }}>
              <FileSignature className="h-4 w-4 mr-2" />{t("Descarcă dosarul complet", "Download complete file")}
            </Button>
          </section>
        )}
        {/* Review CTA — visible after rental is completed and only until the user reviewed */}
        {rental.status === "completed" && !alreadyReviewed && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t("Lasă un review", "Leave a review")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Părerea ta ajută comunitatea Rentli să rămână de încredere.",
                    "Your feedback keeps the Rentli community trustworthy.",
                  )}
                </p>
              </div>
            </div>
            <Button onClick={() => setReviewOpen(true)} className="shrink-0">
              <Star className="h-4 w-4 mr-2" />
              {t("Lasă un review", "Leave a review")}
            </Button>
          </section>
        )}
          {/* ============ PARTEA 1 ============ */}
          {!(p1Done && p2Unlocked) && !isClosedEarly && (
          <ProcessCard
            part={1}
            status={p1Done ? t("Finalizat", "Completed") : t("În desfășurare", "In progress")}
            title={t("Rezervarea produsului", "Booking the product")}
            steps={[t("Rezervare", "Booking"), t("Plată", "Payment"), t("Contract", "Contract")]}
            current={p1Current}
            done={p1Done}
            expandSignal={expandP1}
          >
            <div className="space-y-4">
        {/* Owner: accept/reject pending request */}
        {isOwner && rental.status === "pending" && (
          <section className="rounded-2xl border-2 border-primary bg-primary/5 p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {t("Cerere noua de inchiriere", "New rental request")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    "Acceptă pentru a trimite chiriașului notificarea de plată. Dacă refuzi, poți adăuga un motiv scurt.",
                    "Accept to notify the renter to pay. If you reject, you can add a short reason.",
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button size="lg" onClick={handleAccept} disabled={responding} className="shadow-lg shadow-primary/20">
                  {responding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {t("Acceptă cererea", "Accept request")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={responding}
                  className="border-destructive/40 text-destructive hover:bg-destructive/5"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("Refuză", "Reject")}
                </Button>
              </div>
            </div>
          </section>
        )}
        {/* Owner: waiting for renter payment */}
        {isOwner && rental.status === "confirmed" && rental.payment_status === "pending" && (
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm mb-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {t("Așteptăm plata chiriașului", "Waiting for renter payment")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    "Ai acceptat cererea. Chiriașul urmează să facă plata — te rugăm să aștepți. Vei fi notificat imediat ce plata este confirmată.",
                    "You accepted the request. The renter is about to pay — please wait. You'll be notified as soon as the payment is confirmed.",
                  )}
                </p>
              </div>
            </div>
          </section>
        )}
        {/* Rejection reason */}
        {isRejected && rental.rejection_reason && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 mb-6">
            <h3 className="font-semibold text-rose-900 mb-1">{t("Cerere refuzata", "Request rejected")}</h3>
            <p className="text-sm text-rose-800 whitespace-pre-wrap">{rental.rejection_reason}</p>
          </section>
        )}
        {/* Pay-now CTA: owner accepted, renter hasn't paid yet */}
        {needsPayment && (
          <section className="rounded-2xl border-2 border-primary bg-primary/5 p-5 mb-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {t("Proprietarul a acceptat cererea", "The owner accepted your request")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    "Plătește acum pentru a confirma rezervarea. Suma este blocată pe card și debitată doar după predarea produsului.",
                    "Pay now to confirm the booking. The amount is held on your card and charged only after handover."
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 [&>button]:sm:flex-1">
                <Button size="lg" onClick={handlePay} disabled={paying || payingWallet} className="shadow-lg shadow-primary/20">
                  {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  {t(`Plătește ${payableTotal.toFixed(2)} RON`, `Pay ${payableTotal.toFixed(2)} RON`)}
                </Button>
                {wallet && wallet.available >= payableTotal && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePayWithWallet}
                    disabled={paying || payingWallet}
                    className="border-primary/40 text-primary hover:bg-primary/5"
                  >
                    {payingWallet ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
                    {t("Plătește din wallet", "Pay from wallet")}
                  </Button>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-4 rounded-xl border border-dashed border-yellow-400 bg-yellow-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-800 mb-2 flex items-center gap-1">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {t("Mod admin — testare", "Admin — testing mode")}
                </p>
                <Button
                  onClick={async () => {
                    if (payingTest) return;
                    setPayingTest(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("create-test-checkout-session", {
                        body: { rental_id: rental.id },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      if (!data?.success) throw new Error("Nu s-a putut confirma plata de test");
                      toast.success(t("Plata de test a fost autorizată.", "Test payment authorized."));
                      await refetch();
                    } catch (e: any) {
                      console.error("TEST checkout error:", e);
                      toast.error(e?.message || "Eroare la inițierea plății de test.");
                    } finally {
                      setPayingTest(false);
                    }
                  }}
                  variant="outline"
                  className="w-full h-10 text-sm border-yellow-500 text-yellow-900 hover:bg-yellow-100"
                  size="sm"
                  disabled={payingTest}
                >
                  {payingTest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                  {t("Plătește cu card de test (4242)", "Pay with test card (4242)")}
                </Button>
                <p className="mt-2 text-[10px] text-yellow-800/80 leading-snug">
                  {t(
                    'Nu se debitează bani reali și nu mai ești redirecționat în Stripe. Rezervarea va fi marcată „Test" în dashboard.',
                    'No real money is charged and you are not redirected to Stripe. Booking will be flagged as „Test" in the dashboard.'
                  )}
                </p>
              </div>
            )}
          </section>
        )}
            {!isOwner && rental.status === "pending" && (
              <div className="rounded-xl bg-primary/10 p-5">
                <p className="font-semibold">{t("Cerere trimisă către ", "Request sent to ")}{rental.owner_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Așteptăm răspunsul proprietarului. După acceptare vei putea plăti, iar contractul și anexele se generează pentru ambele părți.", "Waiting for the owner. After acceptance you can pay; the contract and annexes are generated for both parties.")}</p>
              </div>
            )}
        {isPaidEarly && rental.status !== "cancelled" && rental.status !== "rejected" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><FileSignature className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold">{t("Contract de închiriere & Documentele rezervării", "Rental contract & booking documents")}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center gap-2">{contractAcc.bothAccepted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}{t("Contract de închiriere", "Rental contract")}</li>
                  <li className="flex items-center gap-2">{rental.handover_pv_owner_signed_at && rental.handover_pv_renter_signed_at ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}{t("Anexa 1 · Predare", "Annex 1 · Handover")}</li>
                  <li className="flex items-center gap-2">{rental.return_pv_owner_signed_at && rental.return_pv_renter_signed_at ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}{t("Anexa 2 · Returnare", "Annex 2 · Return")}</li>
                </ul>
                <ContractAcceptanceBlock rentalId={rental.id} publicId={rental.public_id} isOwner={isOwner} onOpenContract={() => { setDocsBlank(false); setDocsTab("contract"); setDocsOpen(true); }} t={t} />
                <Button className="mt-3" size="sm" variant="outline" onClick={() => { setDocsBlank(false); setDocsTab("contract"); setDocsOpen(true); }}><FileSignature className="h-4 w-4 mr-1" />{t("Vezi documentele", "View documents")}</Button>
              </div>
            </div>
          </section>
        )}
        {isPaidEarly && rental.status !== "cancelled" && rental.status !== "rejected" && rental.status !== "completed" && !handoverDoneEarly && (
          <div className="mb-6">
            {contractAcc.bothAccepted || contractAcc.loading ? (
              <MeetingDetailsCard
                rentalId={rental.id}
                role={role}
                startDate={rental.start_date}
                defaultPlace={rental.pickup_location || rental.product_location_city}
                onOpenChat={handleChat}
                t={t}
              />
            ) : (
              <section className="rounded-2xl border border-border bg-muted/40 p-5 flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("Stabilirea întâlnirii", "Meeting details")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("Semnați întâi contractul de închiriere. Imediat după semnare veți putea alege intervalul orar de 2 ore și locul exact al predării.", "Sign the rental contract first. Right after signing you can choose the 2-hour slot and the exact handover place.")}</p>
                </div>
              </section>
            )}
          </div>
        )}
            </div>
          </ProcessCard>
          )}

          <RentalDocumentsModal open={docsOpen} onOpenChange={setDocsOpen} rental={rental} initialTab={docsTab} initialBlank={docsBlank} />

          {/* ============ PARTEA 2 ============ */}
          <div className={`${p2Unlocked && !p2Done ? "-order-1" : ""} ${isClosedEarly ? "hidden" : ""}`}>
          <ProcessCard
            part={2}
            status={!p2Unlocked ? t("Urmează", "Next") : p2Done ? t("Finalizat", "Completed") : t("În desfășurare", "In progress")}
            title={t("Predarea și închirierea", "Handover and rental")}
            steps={[t("Proces-verbal", "Report"), t("Predare", "Handover"), t("Închiriere", "Rental"), t("Returnare", "Return"), t("Finalizare", "Completion")]}
            current={p2Current}
            done={p2Done}
            locked={!p2Unlocked}
            expandSignal={expandP2}
          >
            {!p2Unlocked ? (
              <div className="text-center py-6">
                <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="font-heading font-bold text-lg mt-3">{t("Această parte se deschide după discuție", "This part unlocks after the discussion")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!isPaidEarly
                    ? t("Disponibilă după plata rezervării și stabilirea întâlnirii.", "Available after payment and agreeing on the meeting.")
                    : t(`Stabiliți întâlnirea cu ${isOwner ? "chiriașul" : "proprietarul"}, apoi confirmați mai sus pentru a continua procesul.`, "Agree on the meeting, then confirm above to continue.")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
              {handoverDoneEarly && (
                <RentalExtensionCard
                  rental={rental}
                  role={role}
                  active={!returnInitiated && !returnDoneEarly && rental.status !== "cancelled" && rental.status !== "completed"}
                  onOpenAnnex={() => { setDocsBlank(false); setDocsTab("anexa3"); setDocsOpen(true); }}
                />
              )}
              {!handoverDoneEarly && (
                <div className="border-l-2 border-primary bg-primary/10 p-5 rounded-r-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">{t("Ce trebuie să faceți la întâlnire", "What to do at the meeting")}</p>
                  <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      [t("Verificați bunul", "Check the item"), t("Inspectați împreună starea și accesoriile.", "Inspect condition and accessories together.")],
                      [t("Completați PV-ul", "Complete the report"), t("Ambele părți confirmă predarea în aplicație.", "Both parties confirm the handover in the app.")],
                      [t("Activați închirierea", "Activate the rental"), t("Doar PV-ul semnat validează închirierea.", "Only the signed report validates the rental.")],
                    ].map(([h, d], i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-mono text-sm font-bold text-primary">0{i + 1}</span>
                        <span className="text-sm"><span className="font-semibold block">{h}</span><span className="text-muted-foreground text-xs">{d}</span></span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {rental.status !== "cancelled" && rental.status !== "rejected" && (
                <HandoverPvCard
                  rentalId={rental.id}
                  startDate={rental.start_date}
                  signed={handoverDoneEarly}
                  contractReady={contractAcc.bothAccepted || contractAcc.loading}
                  onOpenContract={() => { setDocsBlank(false); setDocsTab("contract"); setDocsOpen(true); }}
                  onOpenPv={() => {
                    if (handoverDoneEarly) { setDocsBlank(false); setDocsTab("anexa1"); setDocsOpen(true); }
                    else document.getElementById("pv-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onOpenBlank={() => { setDocsBlank(true); setDocsTab("anexa1"); setDocsOpen(true); }}
                  t={t}
                />
              )}
        {/* Step 5 — Renter must initiate the return phase */}
        {handoverDoneEarly && !returnInitiated && !returnDoneEarly && rental.status !== "cancelled" && rental.status !== "completed" && (
          <section className="rounded-2xl border-2 border-primary bg-primary/5 p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center shrink-0">
                <PackageOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {t("Pasul 5 — Produsul este in folosire", "Step 5 — Product is in use")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOwner
                    ? t(
                        "Asteptam chiriasul sa initieze returnarea cand este gata.",
                        "Waiting for the renter to initiate the return when ready.",
                      )
                    : t(
                        "Bucura-te de produs! Cand termini, initiaza returnarea — tot tu vei fotografia produsul si vei genera PV-ul de returnare.",
                        "Enjoy the product! When you're done, initiate the return — you'll photograph the product and complete the return PV.",
                      )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              {isOwner ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 text-amber-900 text-xs font-medium px-3 py-2">
                    <Clock className="h-3.5 w-3.5" />
                    {t("Asteptam chiriasul sa initieze returnarea", "Waiting for renter to initiate return")}
                  </div>
                  <Button variant="outline" onClick={handleChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("Discuta in chat", "Chat with renter")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setReturnDialogOpen(true)}
                  disabled={initiatingReturn}
                  className="shadow-lg shadow-primary/20"
                >
                  {initiatingReturn ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                  {t("Initiaza returnarea", "Initiate return")}
                </Button>
              )}
            </div>
          </section>
        )}
        {/* PV (Procese verbale) — full width under the timeline */}
        {(showHandoverPv || showReturnPv) && handoverDoneEarly && (!showReturnPv || returnDoneEarly) && !pvSectionOpen ? (
          <section id="pv-section" className="rounded-2xl border border-border bg-card shadow-sm mb-6 scroll-mt-24">
            <div role="button" onClick={() => setPvSectionOpen(true)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 rounded-2xl">
              <span className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><CheckCircle2 className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-sm">{t("Procese verbale", "Handover documents")}</p>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">{t("Toate semnăturile aplicate · Vezi detalii", "All signatures applied · View details")}<ChevronDown className="h-3.5 w-3.5" /></p>
              </div>
            </div>
          </section>
        ) : (showHandoverPv || showReturnPv) && !handoverDoneEarly && !contractAcc.loading && !contractAcc.bothAccepted ? (
          null
        ) : (showHandoverPv || showReturnPv) && !handoverDoneEarly && new Date() < new Date(String(rental.start_date).slice(0,10) + "T00:00:00") ? (
          <section id="pv-section" className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6 scroll-mt-24 text-center">
            <CalendarClock className="h-6 w-6 mx-auto text-primary" />
            <p className="font-heading font-semibold mt-2">{t("Procesul-verbal se deschide în ziua predării", "The handover report opens on handover day")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t(`Contractul este semnat. Ziua predării: ${new Date(String(rental.start_date).slice(0,10) + "T00:00:00").toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}. Până atunci, stabiliți ora și locul întâlnirii. Fără PV semnat, predarea nu este validată.`, `Handover day: ${String(rental.start_date).slice(0,10)}. Until then, agree on time and place in the chat. Without a signed report, the handover is not validated.`)}</p>
          </section>
        ) : (showHandoverPv || showReturnPv) && (
          <section id="pv-section" className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6 scroll-mt-24">
            {handoverDoneEarly && (!showReturnPv || returnDoneEarly) && (
              <button type="button" onClick={() => setPvSectionOpen(false)} className="mb-2 text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
                {t("Ascunde detaliile", "Hide details")}<ChevronDown className="h-3.5 w-3.5 rotate-180" />
              </button>
            )}
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              {t("Procese verbale", "Handover documents")}
            </h3>
            <div className="flex flex-col gap-4">
              {showHandoverPv && (
                rental.handover_pv_owner_signed_at ? (
                  <PvPanel
                    label={t("PV Predare", "Handover PV")}
                    phase="handover"
                    role={role}
                    ownerSignedAt={rental.handover_pv_owner_signed_at}
                    renterSignedAt={rental.handover_pv_renter_signed_at}
                    onOpen={() => setPvOpen("handover")}
                    t={t}
                    notStarted={false}
                    isCurrentStep={handoverIsCurrent}
                  />
                ) : (
                  <PvPhotoUploadCard
                    rental={rental}
                    phase="handover"
                    role={role}
                    onOpenDocument={() => setPvOpen("handover")}
                    onOpenChat={handleChat}
                  />
                )
              )}
              {showReturnPv && (
                <div className={handoverDoneEarly && !returnDoneEarly ? "-order-1" : ""}>{
                rental.return_pv_renter_signed_at ? (
                  <PvPanel
                    label={t("PV Returnare", "Return PV")}
                    phase="return"
                    role={role}
                    ownerSignedAt={rental.return_pv_owner_signed_at}
                    renterSignedAt={rental.return_pv_renter_signed_at}
                    onOpen={() => setPvOpen("return")}
                    t={t}
                    notStarted={!handoverDoneEarly}
                    isCurrentStep={returnIsCurrent}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <PvPhotoUploadCard
                      rental={rental}
                      phase="return"
                      role={role}
                      onOpenDocument={() => setPvOpen("return")}
                      onOpenChat={handleChat}
                    />
                    <PhysicalPvUpload rentalId={rental.id} publicId={rental.public_id} phase="return" t={t}
                      onOpenBlank={() => { setDocsBlank(true); setDocsTab("anexa2"); setDocsOpen(true); }} />
                  </div>
                )
                }</div>
              )}
            </div>
          </section>
        )}
              {returnDoneEarly && (
                <div className="border-l-2 border-primary bg-primary/10 p-4 rounded-r-xl text-sm">
                  <p className="font-semibold">{t("Închiriere finalizată", "Rental completed")}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t("Ambele procese-verbale sunt semnate. Dosarul complet este disponibil în documentele rezervării.", "Both reports are signed. The full file is available in the booking documents.")}</p>
                </div>
              )}
              </div>
            )}
          </ProcessCard>
          </div>
            {/* Mutual cancellation — visible until owner signs handover PV */}
            {user?.id && rental.status !== "cancelled" && rental.status !== "completed" && rental.status !== "rejected" && !rental.handover_pv_owner_signed_at && (
              <MutualCancellationCard
                rentalId={rental.id}
                cancelRequestStatus={rental.cancel_request_status}
                cancelRequestInitiator={rental.cancel_request_initiator}
                cancelRequestSubject={rental.cancel_request_subject}
                cancelRequestReason={rental.cancel_request_reason}
                currentUserId={user.id}
                isRenter={user.id === rental.renter_id}
                isOwner={user.id === rental.owner_id}
                isAdmin={!!isAdmin}
                paymentStatus={rental.payment_status}
                rentalStatus={rental.status}
                onChanged={async () => { await refetch(); }}
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{counterparty.label}</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/15 text-primary grid place-items-center font-bold shrink-0">
                  {(counterparty.name || "?").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{counterparty.name || "—"}</p>
                  {step >= 3 && counterparty.email && <p className="text-xs text-muted-foreground truncate">{counterparty.email}</p>}
                </div>
              </div>
              {step >= 3 ? (
                counterparty.phone && <p className="flex items-center gap-2 text-sm text-muted-foreground mt-3"><Phone className="h-3.5 w-3.5" />{counterparty.phone}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-3">{t("Datele de contact se afișează după confirmarea plății.", "Contact info appears after payment is confirmed.")}</p>
              )}
              {rental.status !== "cancelled" && rental.status !== "rejected" && (
                <Button onClick={handleChat} className="w-full mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isOwner ? t("Discută cu chiriașul", "Chat with the renter") : t("Discută cu proprietarul", "Chat with the owner")}
                </Button>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-heading font-semibold mb-3">{t("Sumar financiar", "Financial summary")}</h3>
              <dl className="space-y-2 text-sm">
                {(() => {
                  const sub = Number(rental.subtotal || 0);
                  const fee = Number(rental.platform_fee || 0);
                  const sf = Number((rental as any).stripe_fee || 0);
                  const tot = Math.round((sub + fee + sf) * 100) / 100;
                  const paidBy = isOwner ? t(" (plătite de chiriaș)", " (paid by renter)") : "";
                  return (
                    <>
                      <div className="flex justify-between"><dt className="text-muted-foreground">{rental.daily_price} RON × {rental.rental_days} {t("zile", "days")}</dt><dd>{rental.subtotal} RON</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">{t("Taxe operaționale", "Operational fees")}{paidBy}</dt><dd>{fee} RON</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">{t("Service fee Stripe", "Stripe service fee")}{paidBy}</dt><dd>{sf} RON</dd></div>
                      <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                        <dt>{isOwner ? t("Câștig net", "Net earnings") : t("Total de plată", "Total")}</dt>
                        <dd className="text-primary">{isOwner ? rental.owner_payout : tot} RON</dd>
                      </div>
                    </>
                  );
                })()}
              </dl>
              {rental.is_test_payment && (
                <Badge variant="secondary" className="mt-3 text-xs">{t("Plata de test", "Test payment")}</Badge>
              )}
              {!isOwner && <ReceiptLink rentalId={rental.id} t={t} />}
              {!isOwner && (
                <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                  {t(
                    "Pentru închirierile între persoane fizice, documentele justificative oficiale sunt Contractul de locațiune semnat (cu anexele) și chitanța electronică de plată.",
                    "For rentals between individuals, the official supporting documents are the signed rental contract (with annexes) and the electronic payment receipt.",
                  )}
                </p>
              )}
            </section>
            <section className="rounded-r-xl border-l-2 border-primary bg-primary/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">{t("Protecția închirierii", "Rental protection")}</p>
              <p className="text-xs text-foreground/80">{t("Plata este blocată pe card până la predare. Documentele devin disponibile după plata chiriașului.", "Payment is held until handover. Documents become available after the renter pays.")}</p>
            </section>
            {canOpenDispute && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold mb-1">{t("Ai întâmpinat o problemă?", "Having a problem?")}</p>
                <p className="text-xs text-muted-foreground mb-3">{t("Cealaltă parte nu se prezintă, refuză semnarea PV sau bunul are avarii nedeclarate? Echipa Rentli intervine.", "The other party doesn't show up, refuses to sign the report or the item has undeclared damage? The Rentli team steps in.")}</p>
                <Button size="sm" variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setDisputeDialogOpen(true)}>
                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                  {t("Deschide o dispută", "Open a dispute")}
                </Button>
              </section>
            )}
            <OpenDisputeDialog
              open={disputeDialogOpen}
              onOpenChange={(o) => {
                setDisputeDialogOpen(o);
                if (!o) queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] });
              }}
              rentalId={rental.id}
              phase={disputePhase}
            />
            {/* Early return prompt — sub Sumar financiar, aceeași lățime */}
            {handoverDoneEarly && !returnDoneEarly && rental.status !== "completed" && rental.status !== "cancelled" && (
              <EarlyReturnCard
                rentalId={rental.id}
                role={role}
                startDate={rental.start_date}
                endDate={rental.end_date}
                dailyPrice={Number(rental.daily_price)}
                subtotal={Number(rental.subtotal)}
                onOpenChat={handleChat}
                t={t}
              />
            )}
          </aside>
        </div>
      </main>
      <Footer />

      {pvOpen && (
        <PvSignatureDialog
          open={!!pvOpen}
          onOpenChange={(o) => !o && setPvOpen(null)}
          rental={rental}
          phase={pvOpen}
          role={role}
          onSigned={() => refetch()}
        />
      )}

      <LeaveReviewDialog
        open={reviewOpen}
        onOpenChange={(o) => { setReviewOpen(o); if (!o) refetchReview(); }}
        rental={{
          id: rental.id,
          product_id: rental.product_id,
          product_title: rental.product_title || "",
          counterparty_id: isOwner ? rental.renter_id : rental.owner_id,
          counterparty_name: (isOwner ? rental.renter_name : rental.owner_name) || "",
        }}
        currentUserRole={isOwner ? "owner" : "renter"}
      />

      <Dialog open={rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(false); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Refuză cererea de închiriere", "Reject rental request")}</DialogTitle>
            <DialogDescription>
              {t(
                `Ești sigur că vrei să refuzi cererea pentru „${rental.product_title}"?`,
                `Are you sure you want to reject the request for "${rental.product_title}"?`,
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("Motiv (opțional)", "Reason (optional)")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectOpen(false); setRejectReason(""); }} disabled={responding}>
              {t("Anulează", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={responding}>
              {responding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              {t("Refuză cererea", "Reject request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={returnDialogOpen} onOpenChange={(o) => !initiatingReturn && setReturnDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Initiaza returnarea produsului", "Initiate product return")}</DialogTitle>
            <DialogDescription>
              {t(
                "Dupa confirmare, vei fotografia produsul si vei completa procesul verbal de returnare.",
                "After confirmation, you'll photograph the product and complete the return PV.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturnDialogOpen(false)} disabled={initiatingReturn}>
              {t("Renunta", "Cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (initiatingReturn) return;
                setInitiatingReturn(true);
                try {
                  await initiateReturn(rental.id);
                  notify.confirmation({
                    title: t("Returnare inițiată", "Return initiated"),
                    message: t(
                      "Procesul de returnare a fost pornit.",
                      "The return process has been started.",
                    ),
                  });
                  setReturnDialogOpen(false);
                  await Promise.all([refetch(), refetchReturnInitiated()]);
                } catch (e: any) {
                  console.error("initiate_return error:", e);
                  notifyError(e, { fallbackTitle: t("Eroare la inițiere", "Failed to initiate") });
                } finally {
                  setInitiatingReturn(false);
                }
              }}
              disabled={initiatingReturn}
              className="shadow-lg shadow-primary/20"
            >
              {initiatingReturn ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              {t("Confirm returnarea", "Confirm return")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


function ProcessCard({ part, status, title, steps, current, done = false, locked = false, expandSignal = 0, children }: {
  part: number; status: string; title: string; steps: string[]; current: number; done?: boolean; locked?: boolean; expandSignal?: number; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(done);
  const [wasDone, setWasDone] = useState(done);
  if (done !== wasDone) { setWasDone(done); setCollapsed(done); }
  const canToggle = done && !locked;
  const [lastSignal, setLastSignal] = useState(expandSignal);
  if (expandSignal !== lastSignal) { setLastSignal(expandSignal); if (canToggle) setCollapsed(false); }
  return (
    <section id={`part-${part}`} className={`scroll-mt-24 ${locked ? "rounded-2xl border border-dashed border-border bg-muted/60 overflow-hidden" : "rounded-2xl border border-border bg-card shadow-sm overflow-hidden"}`}>
      <div
        className={`flex items-start justify-between gap-3 px-5 sm:px-6 py-5 ${collapsed ? "" : "border-b border-border"} ${canToggle ? "cursor-pointer hover:bg-muted/40" : ""}`}
        onClick={canToggle ? () => setCollapsed((c) => !c) : undefined}
        role={canToggle ? "button" : undefined}
        aria-expanded={canToggle ? !collapsed : undefined}
      >
        <div className="min-w-0">
          <p className={`font-mono text-[11px] uppercase tracking-wider ${locked ? "text-muted-foreground" : "text-primary"}`}>Partea {part} · {status}</p>
          <h2 className="font-heading text-lg sm:text-xl font-bold mt-1">{title}</h2>
          {canToggle && (
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              {collapsed ? "Vezi detalii" : "Ascunde detaliile"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            </p>
          )}
        </div>
        <span className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${locked ? "text-muted-foreground" : "bg-primary/15 text-primary"}`}>
          {locked ? <Lock className="h-4 w-4" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
      </div>
      {!collapsed && (<>
      <div className="px-3 sm:px-6 py-5 border-b border-border">
        <ol className="flex items-start">
          {steps.map((label, i) => {
            const isDone = !locked && (done || i < current);
            const isActive = !locked && !done && i === current;
            return (
              <li key={label} className="flex-1 flex flex-col items-center relative min-w-0">
                {i > 0 && <span className={`absolute top-4 right-1/2 w-full h-px ${isDone || isActive ? "bg-primary" : "bg-border"}`} />}
                <span className={`relative z-10 h-8 w-8 rounded-full grid place-items-center text-xs font-bold border ${
                  isActive ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/15"
                  : isDone ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"}`}>
                  {locked ? <Lock className="h-3.5 w-3.5" /> : isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      </>)}
    </section>
  );
}


function PvRow({ label, ownerSignedAt, renterSignedAt, onOpen }: { label: string; ownerSignedAt: string | null; renterSignedAt: string | null; onOpen: () => void }) {
  const ownerOk = !!ownerSignedAt;
  const renterOk = !!renterSignedAt;
  const both = ownerOk && renterOk;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span className={ownerOk ? "text-emerald-700" : ""}>Proprietar: {ownerOk ? "✓" : "—"}</span>
          <span className={renterOk ? "text-emerald-700" : ""}>Chirias: {renterOk ? "✓" : "—"}</span>
        </div>
      </div>
      <Button size="sm" variant={both ? "outline" : "default"} onClick={onOpen}>
        <FileSignature className="h-4 w-4 mr-2" />{both ? "Vezi PV" : "Deschide"}
      </Button>
    </div>
  );
}

function PvPanel({
  label, phase, role, ownerSignedAt, renterSignedAt, onOpen, t, notStarted = false, isCurrentStep = false,
}: {
  label: string;
  phase: "handover" | "return";
  role: "owner" | "renter";
  ownerSignedAt: string | null;
  renterSignedAt: string | null;
  onOpen: () => void;
  t: (r: string, e: string) => string;
  notStarted?: boolean;
  isCurrentStep?: boolean;
}) {
  const ownerOk = !!ownerSignedAt;
  const renterOk = !!renterSignedAt;
  const both = ownerOk && renterOk;
  const firstSigner: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const mySigned = role === "owner" ? ownerOk : renterOk;
  const otherSigned = role === "owner" ? renterOk : ownerOk;
  const isMyTurn = !notStarted && !mySigned && (role === firstSigner || otherSigned);
  const isLocked = !both && !mySigned && !isMyTurn;

  let statusLabel = "";
  let statusTone = "text-muted-foreground";
  let StatusIcon: any = Clock;
  if (both) { statusLabel = t("Finalizat — ambele semnaturi aplicate", "Completed — both signatures applied"); statusTone = "text-emerald-700"; StatusIcon = CheckCircle2; }
  else if (isMyTurn) { statusLabel = t("Randul tau — completeaza si semneaza", "Your turn — fill in and sign"); statusTone = "text-[#F98715] font-semibold"; StatusIcon = FileSignature; }
  else if (notStarted) {
    statusLabel = t("Disponibil dupa predarea produsului", "Available after the product is handed over");
    statusTone = "text-muted-foreground";
    StatusIcon = Lock;
  }
  else if (isLocked) {
    if (isCurrentStep) {
      // Pasul curent dar e tura celeilalte parti — mesaj direcționat
      if (phase === "handover") {
        statusLabel = t(
          "Proprietarul trebuie sa completeze si sa semneze PV Predare. Vei putea semna imediat dupa.",
          "Owner must complete and sign the Handover PV first. You'll be able to sign right after.",
        );
      } else {
        statusLabel = t(
          "Chiriasul trebuie sa completeze si sa semneze PV Returnare. Vei putea semna imediat dupa.",
          "Renter must complete and sign the Return PV first. You'll be able to sign right after.",
        );
      }
      statusTone = "text-[#F98715] font-medium";
      StatusIcon = Clock;
    } else {
      statusLabel = role === "owner"
        ? t("Asteptam chiriasul", "Waiting for the renter")
        : t("Asteptam proprietarul", "Waiting for the owner");
      statusTone = "text-amber-700";
      StatusIcon = Lock;
    }
  } else if (mySigned && !otherSigned) {
    statusLabel = role === "owner"
      ? t("Ai semnat — asteptam chiriasul", "You signed — waiting for the renter")
      : t("Ai semnat — asteptam proprietarul", "You signed — waiting for the owner");
    statusTone = "text-emerald-700";
    StatusIcon = CheckCircle2;
  }

  const highlight = isCurrentStep && !both;
  return (
    <div
      className={
        highlight
          ? "rounded-xl border-2 border-primary bg-primary/5 ring-2 ring-primary/15 shadow-sm p-4 flex flex-col gap-3"
          : "rounded-xl border border-border bg-background p-4 flex flex-col gap-3"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-sm flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          {label}
        </p>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 shrink-0">
            {t("Pasul urmator", "Next step")}
          </span>
        )}
      </div>
      <div className={`flex items-center gap-2 text-xs ${statusTone}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        <span>{statusLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${ownerOk ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted text-muted-foreground"}`}>
          {ownerOk ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          Proprietar
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${renterOk ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted text-muted-foreground"}`}>
          {renterOk ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          Chirias
        </span>
      </div>
      <Button
        size="sm"
        variant={both ? "outline" : "default"}
        onClick={onOpen}
        disabled={isLocked && !both}
        className="w-full sm:w-auto sm:self-end"
      >
        {both ? <CheckCircle2 className="h-4 w-4 mr-2" /> : isLocked ? <Lock className="h-4 w-4 mr-2" /> : <FileSignature className="h-4 w-4 mr-2" />}
        {both ? t("Vezi PV", "View PV") : isLocked ? t("Blocat", "Locked") : t("Deschide", "Open")}
      </Button>
    </div>
  );
}

export default RentalDetailPage;