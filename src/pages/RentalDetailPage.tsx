import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, MessageSquare, FileSignature, Loader2, Package, ShieldX, ExternalLink, Phone, Mail, CreditCard, Lock, CheckCircle2, Clock } from "lucide-react";
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
import { getRentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import PvSignatureDialog from "@/components/rentals/PvSignatureDialog";
import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import { payForConfirmedRental } from "@/features/rentals/rentalsApi";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const RentalDetailPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (r: string, e: string) => (language === "ro" ? r : e);
  const [pvOpen, setPvOpen] = useState<null | "handover" | "return">(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: rental, isLoading, error, refetch } = useQuery({
    queryKey: ["rental-detail", publicId],
    queryFn: () => getRentalFullDetail(publicId!),
    enabled: !!publicId && !!user?.id,
  });

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
  const showReturnPvEarly = isPaidEarly && stepEarly >= 3;
  const handoverDoneEarly = !!(rental?.handover_pv_owner_signed_at && rental?.handover_pv_renter_signed_at);

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
    if (convId) navigate(`/mesaje?conv=${convId}`);
  }

  const isRejected = rental.status === "rejected" || (rental.status === "cancelled" && !!rental.rejection_reason);
  const needsPayment = !isOwner && rental.status === "confirmed" && rental.payment_status === "pending";

  async function handlePay() {
    if (paying) return;
    setPaying(true);
    try {
      const url = await payForConfirmedRental(rental.id);
      window.location.href = url;
    } catch (e: any) {
      console.error("payForConfirmedRental error:", e);
      if (e?.code === "KYC_REQUIRED") {
        toast.error(t("Verificare identitate necesară.", "Identity verification required."));
        navigate("/verificare");
      } else {
        toast.error(e?.message || t("Eroare la inițierea plății.", "Error initiating payment."));
      }
      setPaying(false);
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
          <div>
            <p className="text-xs font-mono text-muted-foreground">{rental.public_id}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              {t("Inchiriere", "Rental")} — {rental.product_title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(rental.start_date), "d MMM yyyy", { locale: roLocale })} – {format(new Date(rental.end_date), "d MMM yyyy", { locale: roLocale })} · {rental.rental_days} {t("zile", "days")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={rental.status as any} />
            <Badge variant="outline">{role === "owner" ? t("Tu esti proprietar", "You are owner") : t("Tu esti chirias", "You are renter")}</Badge>
          </div>
        </div>

        {/* Timeline */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
          <RentalTimeline rental={tlRental} />
        </section>

        {/* Chat CTA — visible after payment is authorized */}
        {isPaidEarly && (
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
                  {t("Coordonati predarea, locatia si detaliile direct in chat.", "Coordinate handover, location and details directly in chat.")}
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

        {/* PV (Procese verbale) — full width under the timeline */}
        {(showHandoverPv || showReturnPv) && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              {t("Procese verbale", "Handover documents")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showHandoverPv && (
                <PvPanel
                  label={t("PV Predare", "Handover PV")}
                  phase="handover"
                  role={role}
                  ownerSignedAt={rental.handover_pv_owner_signed_at}
                  renterSignedAt={rental.handover_pv_renter_signed_at}
                  onOpen={() => setPvOpen("handover")}
                  t={t}
                  notStarted={false}
                />
              )}
              {showReturnPv && (
                <PvPanel
                  label={t("PV Returnare", "Return PV")}
                  phase="return"
                  role={role}
                  ownerSignedAt={rental.return_pv_owner_signed_at}
                  renterSignedAt={rental.return_pv_renter_signed_at}
                  onOpen={() => setPvOpen("return")}
                  t={t}
                  notStarted={!handoverDoneEarly}
                />
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
              <Button size="lg" onClick={handlePay} disabled={paying} className="shadow-lg shadow-primary/20">
                {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {t(`Plătește ${rental.subtotal} RON`, `Pay ${rental.subtotal} RON`)}
              </Button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: product + parties */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><Package className="h-4 w-4 text-primary" />{t("Produs inchiriat", "Rented product")}</h3>
              <div className="flex gap-4">
                <img src={rental.product_image || "/placeholder.svg"} alt={rental.product_title || ""} className="w-28 h-28 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/produs/${rental.product_id}`} className="font-semibold hover:text-primary transition-colors flex items-center gap-1">
                    {rental.product_title} <ExternalLink className="h-3 w-3" />
                  </Link>
                  {rental.product_category && <p className="text-xs text-muted-foreground mt-1">{rental.product_category}</p>}
                  {rental.product_location_city && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{rental.product_location_city}</p>
                  )}
                  {rental.product_included_items && rental.product_included_items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">{t("Incluse:", "Included:")}</p>
                      <ul className="text-xs list-disc list-inside space-y-0.5">
                        {rental.product_included_items.map((it, i) => <li key={i}>{it}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>

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
              <Button variant="outline" size="sm" className="mt-3" onClick={handleChat}>
                <MessageSquare className="h-4 w-4 mr-2" />{t("Trimite mesaj", "Send message")}
              </Button>
            </section>

            {/* Payment status */}
            <Collapsible className="rounded-2xl border border-border bg-card shadow-sm">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-5 h-auto font-semibold">
                  {t("Detalii plata", "Payment details")}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-5 pb-5">
                <RentalPaymentStatus rentalId={rental.id} mode="user" />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right: pricing */}
          <aside className="space-y-3">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sticky top-24">
              <h3 className="font-heading font-semibold mb-3">{t("Sumar financiar", "Financial summary")}</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{rental.daily_price} RON × {rental.rental_days} {t("zile", "days")}</dt><dd>{rental.subtotal} RON</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("Comision Rentli", "Platform fee")}</dt><dd>{rental.platform_fee} RON</dd></div>
                {rental.product_deposit_value ? (
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("Garantie", "Deposit")}</dt><dd>{rental.product_deposit_value} RON</dd></div>
                ) : null}
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                  <dt>{isOwner ? t("Castig net", "Net earnings") : t("Total", "Total")}</dt>
                  <dd className="text-primary">{isOwner ? rental.owner_payout : rental.subtotal} RON</dd>
                </div>
              </dl>
              {rental.is_test_payment && (
                <Badge variant="secondary" className="mt-3 text-xs">{t("Plata de test", "Test payment")}</Badge>
              )}
            </section>
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
  label, phase, role, ownerSignedAt, renterSignedAt, onOpen, t, notStarted = false,
}: {
  label: string;
  phase: "handover" | "return";
  role: "owner" | "renter";
  ownerSignedAt: string | null;
  renterSignedAt: string | null;
  onOpen: () => void;
  t: (r: string, e: string) => string;
  notStarted?: boolean;
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
    statusLabel = role === "owner"
      ? t("Asteptam chiriasul", "Waiting for the renter")
      : t("Asteptam proprietarul", "Waiting for the owner");
    statusTone = "text-amber-700";
    StatusIcon = Lock;
  } else if (mySigned && !otherSigned) {
    statusLabel = role === "owner"
      ? t("Ai semnat — asteptam chiriasul", "You signed — waiting for the renter")
      : t("Ai semnat — asteptam proprietarul", "You signed — waiting for the owner");
    statusTone = "text-emerald-700";
    StatusIcon = CheckCircle2;
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-sm flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          {label}
        </p>
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