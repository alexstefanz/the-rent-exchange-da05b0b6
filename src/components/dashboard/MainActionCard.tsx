import { getOrCreateRentalConversation } from "@/features/messaging/messagingApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Camera, Check, CheckCircle2, ClipboardCheck, Hourglass, Lock,
  MessageCircle, MoreHorizontal, Package, RotateCcw, ShieldAlert, ShieldCheck, Truck, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePvProgress } from "@/hooks/queries/usePvProgress";

type Role = "renter" | "owner";

export interface MainActionRental {
  id: string;
  product_id?: string | null;
  product_title?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  payment_status?: string | null;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  dispute_status?: "none" | "open" | "resolved" | null;
}

interface Props {
  rental: MainActionRental;
  step: number;
  cancelled?: boolean;
  role: Role;
  /** Owner: open inspection (checkout for step 3, checkin for step 5) */
  onStartInspection?: () => void;
  /** Owner-only: confirm hand-over (step 3) once both PVs are ready */
  onConfirmHandover?: () => void;
  /** Owner-only: confirm return (step 5) once both PVs are ready */
  onConfirmReturn?: () => void;
  /** Owner-only: respond to incoming request (step 1/2) */
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  /** Open chat (both roles) */
  onChat?: () => void;
  /** Renter-only: pay for a confirmed rental (step 2, payment_status=pending) */
  onPay?: () => void;
  isPaying?: boolean;
  /** Step 6: leave review */
  onLeaveReview?: () => void;
  /** Optional secondary actions menu (anchor passed by parent) */
  secondaryActions?: React.ReactNode;
  isConfirming?: boolean;
}

function t(language: string, ro: string, en: string) {
  return language === "ro" ? ro : en;
}

const MainActionCard = ({
  rental, step, cancelled, role,
  onStartInspection, onConfirmHandover, onConfirmReturn,
  onAcceptRequest, onRejectRequest, onChat, onPay, isPaying, onLeaveReview,
  secondaryActions, isConfirming,
}: Props) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: pv } = usePvProgress(rental.id);

  const isDisputed = rental.dispute_status === "open";
  const isCancelled = !!cancelled;
  const handleChat = onChat ?? (async () => {
    const convId = await getOrCreateRentalConversation(rental.id);
    navigate(convId ? `/mesaje?conv=${convId}` : "/mesaje", {
      state: { returnTo: { pathname: window.location.pathname, search: window.location.search } },
    });
  });
  const paymentMade = rental.payment_status === "authorized" || rental.payment_status === "paid" || rental.payment_status === "captured";
  const showChatButton = paymentMade || isDisputed;

  // ---------- Build the variant ----------
  let icon = <Hourglass className="h-5 w-5" />;
  let title = "";
  let desc = "";
  let primaryLabel = "";
  let primaryIcon: React.ReactNode = <ArrowRight className="ml-1 h-4 w-4" />;
  let primaryAction: (() => void) | undefined;
  let primaryDisabled = false;
  let primaryTooltip = "";
  let primaryVariant: "default" | "outline" = "default";
  let pvSubStatus: { you: boolean; partner: boolean; phaseLabel: string } | null = null;
  let secondaryReject: (() => void) | undefined;

  // Per-phase PV state for hand-over (step 3) and return (step 5)
  const youDoneCheckout = pv ? (role === "owner" ? pv.ownerCheckout : pv.renterCheckout) : false;
  const partnerDoneCheckout = pv ? (role === "owner" ? pv.renterCheckout : pv.ownerCheckout) : false;
  const youDoneCheckin = pv ? (role === "owner" ? pv.ownerCheckin : pv.renterCheckin) : false;
  const partnerDoneCheckin = pv ? (role === "owner" ? pv.renterCheckin : pv.ownerCheckin) : false;
  const bothCheckout = !!pv && pv.ownerCheckout && pv.renterCheckout;
  const bothCheckin = !!pv && pv.ownerCheckin && pv.renterCheckin;

  if (isCancelled) {
    icon = <ShieldAlert className="h-5 w-5" />;
    title = t(language, "Rezervare anulată", "Rental cancelled");
    desc = t(language, "Această rezervare nu mai este activă.", "This rental is no longer active.");
  } else if (isDisputed) {
    icon = <ShieldAlert className="h-5 w-5" />;
    title = t(language, "Dispută în analiză", "Dispute under review");
    desc = t(language, "Echipa Rentli analizează cazul. Plata este blocată până la rezoluție.", "The Rentli team is reviewing this case. Payment is held until resolution.");
    primaryLabel = t(language, "Vezi tichetul", "View ticket");
    primaryAction = () => navigate("/suport");
    primaryVariant = "outline";
  } else if (step === 6) {
    icon = <CheckCircle2 className="h-5 w-5" />;
    title = t(language, "Rezervare finalizată", "Rental completed");
    desc = role === "renter"
      ? t(language, "Rezervarea s-a încheiat. Lasă un review scurt pentru a ajuta comunitatea.", "Rental completed. Leave a short review to help the community.")
      : t(language, "Banii vor apărea în balanță în 24-48h. Lasă un review chiriașului.", "Funds will appear in your balance in 24-48h. Leave a review for the renter.");
    if (onLeaveReview) {
      primaryLabel = t(language, "Lasă un review", "Leave a review");
      primaryAction = onLeaveReview;
    }
  } else if (step === 5) {
    // Return phase
    icon = <RotateCcw className="h-5 w-5" />;
    pvSubStatus = { you: youDoneCheckin, partner: partnerDoneCheckin, phaseLabel: t(language, "PV retur", "Return PV") };
    if (!youDoneCheckin) {
      title = t(language, "Pregătește returnarea produsului", "Prepare the return");
      desc = t(language, "Coordonează în chat și completează procesul verbal de retur.", "Coordinate in chat and complete the return inspection report.");
      primaryLabel = t(language, "Începe procesul verbal", "Start inspection report");
      primaryIcon = <Camera className="ml-1 h-4 w-4" />;
      primaryAction = onStartInspection;
    } else if (!partnerDoneCheckin) {
      title = t(language, "Așteptăm cealaltă parte", "Waiting for the other party");
      desc = t(language, "Procesul tău verbal e gata. Așteaptă completarea de partener.", "Your report is ready. Waiting for the partner to complete theirs.");
      if (role === "owner") {
        primaryLabel = t(language, "Confirmă returnarea", "Confirm return");
        primaryDisabled = true;
        primaryIcon = <Lock className="ml-1 h-4 w-4" />;
        primaryTooltip = t(language, "Așteptăm procesul verbal de la chiriaș.", "Waiting for the renter's report.");
      }
    } else if (role === "owner") {
      title = t(language, "Poți confirma returnarea", "You can confirm the return");
      desc = t(language, "Ambele procese verbale sunt completate. Confirmă pentru a închide rezervarea.", "Both reports are complete. Confirm to close the rental.");
      primaryLabel = t(language, "Confirmă returnarea", "Confirm return");
      primaryIcon = <Check className="ml-1 h-4 w-4" />;
      primaryAction = onConfirmReturn;
    } else {
      title = t(language, "Așteptăm confirmarea proprietarului", "Waiting for owner confirmation");
      desc = t(language, "Ambele procese verbale sunt completate. Proprietarul confirmă returul.", "Both reports are complete. The owner will confirm the return.");
    }
  } else if (step === 4) {
    icon = <Package className="h-5 w-5" />;
    title = t(language, "Produs activ", "Item in use");
    desc = rental.end_date
      ? t(language, `Returnare programată pentru ${new Date(rental.end_date).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" })}.`, `Return scheduled for ${new Date(rental.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`)
      : t(language, "Bucură-te de închiriere.", "Enjoy your rental.");
  } else if (step === 3) {
    // Hand-over phase
    icon = <Truck className="h-5 w-5" />;
    pvSubStatus = { you: youDoneCheckout, partner: partnerDoneCheckout, phaseLabel: t(language, "PV predare", "Hand-over PV") };
    if (!youDoneCheckout) {
      title = t(language, "Pregătește predarea produsului", "Prepare the hand-over");
      desc = t(language, "Discutați în chat detaliile întâlnirii și completați procesul verbal pentru a continua.", "Discuss meeting details in chat and complete the inspection report to continue.");
      primaryLabel = t(language, "Începe procesul verbal", "Start inspection report");
      primaryIcon = <Camera className="ml-1 h-4 w-4" />;
      primaryAction = onStartInspection;
    } else if (!partnerDoneCheckout) {
      title = t(language, "Așteptăm cealaltă parte", "Waiting for the other party");
      desc = t(language, "Procesul tău verbal e gata. Așteaptă completarea de partener.", "Your report is ready. Waiting for the partner to complete theirs.");
      if (role === "owner") {
        primaryLabel = t(language, "Confirmă predarea", "Confirm hand-over");
        primaryDisabled = true;
        primaryIcon = <Lock className="ml-1 h-4 w-4" />;
        primaryTooltip = t(language, "Așteptăm procesul verbal de la chiriaș.", "Waiting for the renter's report.");
      }
    } else if (role === "owner") {
      title = t(language, "Poți confirma predarea", "You can confirm the hand-over");
      desc = t(language, "Ambele procese verbale sunt completate. Confirmă pentru a începe închirierea.", "Both reports are complete. Confirm to start the rental.");
      primaryLabel = t(language, "Confirmă predarea", "Confirm hand-over");
      primaryIcon = <Check className="ml-1 h-4 w-4" />;
      primaryAction = onConfirmHandover;
    } else {
      title = t(language, "Așteptăm confirmarea proprietarului", "Waiting for owner confirmation");
      desc = t(language, "Ambele procese verbale sunt completate. Proprietarul confirmă predarea.", "Both reports are complete. The owner will confirm the hand-over.");
    }
  } else if (step === 2) {
    icon = <ShieldCheck className="h-5 w-5" />;
    if (role === "owner") {
      title = t(language, "Ai o cerere nouă", "You have a new request");
      desc = t(language, "Răspunde în maxim 24h. Plata este blocată în siguranță.", "Respond within 24h. Payment is held securely.");
      if (onAcceptRequest) {
        primaryLabel = t(language, "Acceptă cererea", "Accept request");
        primaryAction = onAcceptRequest;
        secondaryReject = onRejectRequest;
      }
    } else if (rental.status === "confirmed" && rental.payment_status === "pending") {
      icon = <CreditCard className="h-5 w-5" />;
      title = t(language, "Proprietarul a acceptat cererea", "The owner accepted your request");
      desc = t(language, "Finalizează plata pentru a rezerva produsul. Suma este blocată pe card și debitată doar după predare.", "Complete the payment to reserve the item. The amount is held on your card and charged only after handover.");
      if (onPay) {
        primaryLabel = t(language, "Plătește acum", "Pay now");
        primaryIcon = <CreditCard className="ml-1 h-4 w-4" />;
        primaryAction = onPay;
      }
    } else {
      title = t(language, "Așteaptă răspunsul proprietarului", "Waiting for owner");
      desc = t(language, "Plata este blocată în siguranță. Proprietarul răspunde în maxim 24h.", "Payment is securely held. The owner replies within 24h.");
    }
  } else {
    // step 1
    icon = <Hourglass className="h-5 w-5" />;
    title = t(language, "Cerere trimisă", "Request sent");
    desc = t(language, "Așteaptă confirmarea plății.", "Awaiting payment confirmation.");
  }

  // ---------- Render ----------
  const accent = isCancelled || isDisputed
    ? "border-rose-300 bg-rose-50/60"
    : "border-[#F98715]/25 bg-gradient-to-br from-[#fff5ec] to-[#ffe7d3]/40";

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5 animate-fade-in", accent)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[#b85a00] shadow-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground/60">
            {t(language, "Următorul pas", "Next step")}
          </p>
          <h4 className="mt-0.5 font-heading text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h4>
          <p className="mt-1 text-sm text-foreground/80">{desc}</p>

          {/* PV sub-status */}
          {pvSubStatus && (
            <div className="mt-3 inline-flex items-center gap-3 rounded-lg bg-white/80 px-3 py-1.5 text-xs">
              <span className="font-medium text-foreground/70">{pvSubStatus.phaseLabel}</span>
              <span className={cn("flex items-center gap-1", pvSubStatus.you ? "text-emerald-600" : "text-muted-foreground")}>
                {pvSubStatus.you ? <Check className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
                {t(language, "Tu", "You")}
              </span>
              <span className="text-border">·</span>
              <span className={cn("flex items-center gap-1", pvSubStatus.partner ? "text-emerald-600" : "text-muted-foreground")}>
                {pvSubStatus.partner ? <Check className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
                {role === "owner" ? t(language, "Chiriaș", "Renter") : t(language, "Proprietar", "Owner")}
              </span>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {primaryLabel && (
              primaryDisabled ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button disabled size="sm" variant={primaryVariant}>
                          {primaryLabel}
                          {primaryIcon}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {primaryTooltip && <TooltipContent>{primaryTooltip}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button onClick={primaryAction} size="sm" variant={primaryVariant} disabled={isConfirming}>
                  {primaryLabel}
                  {primaryIcon}
                </Button>
              )
            )}
            {showChatButton && (
              <Button variant="outline" size="sm" onClick={handleChat} className="bg-white/70">
                <MessageCircle className="h-4 w-4 mr-1" />
                {t(language, "Deschide chat", "Open chat")}
              </Button>
            )}
            {secondaryReject && (
              <Button variant="ghost" size="sm" onClick={secondaryReject} className="text-destructive hover:text-destructive">
                {t(language, "Refuză", "Reject")}
              </Button>
            )}
            {secondaryActions && (
              <div className="ml-auto">
                {secondaryActions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainActionCard;