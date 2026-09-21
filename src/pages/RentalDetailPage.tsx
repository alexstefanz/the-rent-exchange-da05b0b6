import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, MessageSquare, FileSignature, Loader2, Package, ShieldX, ExternalLink, Phone, Mail, CreditCard, Lock, CheckCircle2, Clock, Star, FlaskConical, Wallet, Check, X, MessageCircle, RotateCcw, PackageOpen } from "lucide-react";
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
  const [responding, setResponding] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [initiatingReturn, setInitiatingReturn] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
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

  const { data: returnInitiated = false, refetch: refetchReturnInitiated } = useQuery({
    queryKey: ["return-initiated", rental?.id],
    queryFn: () => getReturnInitiated(rental!.id),
    enabled: !!rental?.id,
  });

  // Realtime: refetch rental detail on rentals + rental_pv_documents changes.
  useEffect(() => {
    if (!rental?.id || !publicId) return;
    const channel = supabase
      .channel(`rental-detail-rt-${rental.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `id=eq.${rental.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] }),
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
  } : null;
  const stepEarly = tlRentalEarly ? getTimelineStep(tlRentalEarly).current : 0;
  const isPaidEarly = !!rental && (rental.payment_status === "authorized" || rental.payment_status === "paid" || rental.payment_status === "captured");
  // Both PVs are always visible once the rental is paid; activation/locking is handled inside the panels.
  const showHandoverPvEarly = isPaidEarly && stepEarly >= 3;
  const showReturnPvEarly = isPaidEarly && stepEarly >= 3 && returnInitiated;
  const handoverDoneEarly = !!(rental?.handover_pv_owner_signed_at && rental?.handover_pv_renter_signed_at);
  const returnDoneEarly = !!(rental?.return_pv_owner_signed_at && rental?.return_pv_renter_signed_at);
  const handoverIsCurrent = isPaidEarly && !handoverDoneEarly;
  const returnIsCurrent = handoverDoneEarly && !returnDoneEarly;

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
  };
  const { current: step, cancelled } = getTimelineStep(tlRental);

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
      toast.success(t("Plată reușită din wallet!", "Paid from wallet!"));
      await Promise.all([refetch(), refetchWallet()]);
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
          <RentalTimeline rental={tlRental} />
        </section>

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

        {/* Chat CTA — visible in all states except completed/cancelled/rejected */}
        {rental.status !== "completed" && rental.status !== "cancelled" && rental.status !== "rejected" && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isOwner
                    ? t("Discuta cu chiriasul", "Chat with the renter")
                    : t("Discuta cu proprietarul", "Chat with the owner")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPaidEarly
                    ? t("Coordonati predarea, locatia si detaliile direct in chat.", "Coordinate handover, location and details directly in chat.")
                    : t(
                        "Poți discuta în chat și înainte de plată. Datele de contact devin vizibile după ce plata este efectuată.",
                        "You can chat before payment too. Contact details become visible after the payment is completed."
                      )}
                </p>
              </div>
            </div>
            <Button onClick={handleChat} className="shrink-0">
              <MessageSquare className="h-4 w-4 mr-2" />
              {isOwner
                ? t("Discuta cu Chiriasul", "Chat with Renter")
                : t("Discuta cu Proprietarul", "Chat with Owner")}
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

        {/* PV (Procese verbale) — full width under the timeline */}
        {(showHandoverPv || showReturnPv) && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              {t("Procese verbale", "Handover documents")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <PvPhotoUploadCard
                    rental={rental}
                    phase="return"
                    role={role}
                    onOpenDocument={() => setPvOpen("return")}
                    onOpenChat={handleChat}
                  />
                )
              )}
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
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
              <div className="flex flex-col gap-2">
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
                    {t(
                      `Plătește din wallet (${wallet.available.toFixed(2)} RON disponibili)`,
                      `Pay from wallet (${wallet.available.toFixed(2)} RON available)`
                    )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: product + parties */}
          <div className="lg:col-span-2 space-y-6">
            {/* Counterparty */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-heading font-semibold mb-3">{counterparty.label}</h3>
              <p className="font-medium">{counterparty.name || "—"}</p>
              {step >= 3 ? (
                <div className="mt-2 space-y-1 text-sm">
                  {counterparty.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{counterparty.email}</p>}
                  {counterparty.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{counterparty.phone}</p>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">{t("Datele de contact se vor afisa dupa confirmarea platii.", "Contact info appears after payment is confirmed.")}</p>
              )}
            </section>

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

          {/* Right: pricing */}
          <aside className="space-y-3">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-heading font-semibold mb-3">{t("Sumar financiar", "Financial summary")}</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{rental.daily_price} RON × {rental.rental_days} {t("zile", "days")}</dt><dd>{rental.subtotal} RON</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("Comision Rentli", "Platform fee")}</dt><dd>{rental.platform_fee} RON</dd></div>
                {rental.product_deposit_value ? (
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("Garantie", "Deposit")}</dt><dd>{rental.product_deposit_value} RON</dd></div>
                ) : null}
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                  <dt>{isOwner ? t("Castig net", "Net earnings") : t("Total", "Total")}</dt>
                  <dd className="text-primary">
                    {isOwner
                      ? rental.owner_payout
                      : Math.round((Number(rental.subtotal || 0) + Number(rental.platform_fee || 0)) * 100) / 100}
                    {" "}RON
                  </dd>
                </div>
              </dl>
              {rental.is_test_payment && (
                <Badge variant="secondary" className="mt-3 text-xs">{t("Plata de test", "Test payment")}</Badge>
              )}
            </section>

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