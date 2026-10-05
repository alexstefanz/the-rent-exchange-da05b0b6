import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { requestMutualCancellation, withdrawCancellationRequest, cancelUnpaidRental } from "@/features/rentals/rentalsApi";

interface Props {
  rentalId: string;
  cancelRequestStatus?: string | null;
  cancelRequestInitiator?: string | null;
  cancelRequestSubject?: string | null;
  cancelRequestReason?: string | null;
  currentUserId: string;
  isRenter?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  paymentStatus?: string | null;
  rentalStatus?: string | null;
  onChanged: () => void | Promise<void>;
}

const MutualCancellationCard = ({
  rentalId, cancelRequestStatus, cancelRequestInitiator,
  cancelRequestSubject, cancelRequestReason,
  currentUserId, isRenter, isOwner, isAdmin, paymentStatus, rentalStatus, onChanged,
}: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = cancelRequestStatus === "pending";
  const iAmInitiator = isPending && cancelRequestInitiator === currentUserId;
  const unpaid = !paymentStatus || ["pending", "failed", "canceled", "cancelled"].includes(paymentStatus);
  const canSelfCancelUnpaid = unpaid && rentalStatus !== "cancelled" && rentalStatus !== "completed";
  const isParticipant = !!isRenter || !!isOwner;

  // Hide entirely from users who are neither renter, owner, nor admin
  if (!isParticipant && !isAdmin) return null;

  async function selfCancelUnpaid() {
    setBusy(true);
    setFormError(null);
    try {
      await cancelUnpaidRental(rentalId);
      toast.success(
        t(
          "Rezervarea a fost anulată. Ambele părți au fost notificate.",
          "Reservation cancelled. Both parties have been notified.",
        ),
      );
      setConfirmOpen(false);
      await onChanged();
    } catch (e: any) {
      const msg = String(e?.message || "");
      const friendly = msg.includes("PAYMENT_ACTIVE")
        ? t("Plata a fost deja efectuată — anularea trebuie solicitată către admin.", "Payment already made — cancellation must be requested from an admin.")
        : msg.includes("HANDOVER_ALREADY_SIGNED")
        ? t("Predarea a fost deja confirmată, nu se mai poate anula.", "Handover already confirmed, cannot cancel.")
        : msg.includes("INVALID_STATUS")
        ? t("Rezervarea nu mai poate fi anulată în starea actuală.", "Reservation can no longer be cancelled in its current state.")
        : msg || t("Eroare la anulare.", "Error cancelling.");
      setFormError(friendly);
    } finally { setBusy(false); }
  }

  async function submitRequest() {
    setFormError(null);
    if (subject.trim().length < 3) {
      setFormError(t("Subiectul e prea scurt (minim 3 caractere).", "Subject too short (min 3 characters)."));
      return;
    }
    if (reason.trim().length < 10) {
      setFormError(t("Te rugăm să descrii motivul în minim 10 caractere.", "Please provide a reason (min 10 characters)."));
      return;
    }
    if (!accepted) {
      setFormError(t("Confirmă că cererea va fi revizuită de un admin.", "Confirm that an admin will review the request."));
      return;
    }
    setBusy(true);
    try {
      await requestMutualCancellation(rentalId, subject.trim(), reason.trim());
      toast.success(t("Cerere trimisă către admin pentru revizuire.", "Request sent to admin for review."));
      setOpen(false); setSubject(""); setReason(""); setAccepted(false);
      await onChanged();
    } catch (e: any) {
      setFormError(e?.message || t("Eroare la trimitere.", "Error sending request."));
    } finally { setBusy(false); }
  }

  async function withdraw() {
    if (!confirm(t("Retragi solicitarea de anulare?", "Withdraw your cancellation request?"))) return;
    setBusy(true);
    try {
      await withdrawCancellationRequest(rentalId);
      toast.success(t("Solicitare retrasă.", "Request withdrawn."));
      await onChanged();
    } catch (e: any) {
      toast.error(e?.message || t("Eroare.", "Error."));
    } finally { setBusy(false); }
  }

  // Pending request — informative state for both parties
  if (isPending) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 grid place-items-center shrink-0">
            <Clock className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-900">
              {t("Cerere de anulare în revizuire la admin", "Cancellation request under admin review")}
            </h3>
            {cancelRequestSubject && (
              <p className="text-xs mt-2 text-amber-900 bg-white/70 rounded-lg p-2 border border-amber-200">
                <span className="font-semibold">{t("Subiect:", "Subject:")}</span> {cancelRequestSubject}
              </p>
            )}
            {cancelRequestReason && (
              <p className="text-xs mt-2 text-amber-900 bg-white/70 rounded-lg p-2 border border-amber-200">
                <span className="font-semibold">{t("Motiv:", "Reason:")}</span> {cancelRequestReason}
              </p>
            )}
            <p className="text-xs text-amber-900/80 mt-2">
              {t("Vei primi o notificare când adminul ia o decizie.", "You'll be notified when an admin makes a decision.")}
            </p>
          </div>
          {iAmInitiator && (
            <Button variant="outline" size="sm" onClick={withdraw} disabled={busy}>
              {t("Retrage", "Withdraw")}
            </Button>
          )}
        </div>
      </section>
    );
  }

  // No pending request — before payment, either party can cancel instantly
  if (canSelfCancelUnpaid) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center shrink-0">
            <Ban className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {t("Anulează rezervarea", "Cancel reservation")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "Plata nu a fost efectuată — poți anula instant, fără aprobarea unui admin. Cealaltă parte va fi notificată.",
                "Payment hasn't been processed — you can cancel instantly, without admin approval. The other party will be notified.",
              )}
            </p>
          </div>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                {t("Anulează", "Cancel")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("Confirmi anularea?", "Confirm cancellation?")}</DialogTitle>
                <DialogDescription>
                  {isAdmin && !isParticipant
                    ? t(
                        "Anulezi ca admin. Ambele părți vor fi notificate prin email, SMS și notificare în aplicație.",
                        "Cancelling as admin. Both parties will be notified by email, SMS and in-app notification.",
                      )
                    : isRenter
                    ? t(
                        "Rezervarea va fi anulată imediat. Proprietarul va fi notificat prin email, SMS și notificare în aplicație.",
                        "The reservation will be cancelled immediately. The owner will be notified by email, SMS and in-app notification.",
                      )
                    : t(
                        "Rezervarea va fi anulată imediat. Chiriașul va fi notificat prin email, SMS și notificare în aplicație.",
                        "The reservation will be cancelled immediately. The renter will be notified by email, SMS and in-app notification.",
                      )}
                </DialogDescription>
              </DialogHeader>
              {formError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={busy}>
                  {t("Înapoi", "Back")}
                </Button>
                <Button variant="destructive" onClick={selfCancelUnpaid} disabled={busy}>
                  {busy ? t("Se anulează…", "Cancelling…") : t("Da, anulează", "Yes, cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center shrink-0">
          <Ban className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">
            {t("Anulare comandă", "Cancel order")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "Poți solicita anularea. Cererea va fi revizuită de un admin. Disponibil până la semnarea PV de predare.",
              "You can request a cancellation. An admin will review it. Available until the handover PV is signed.",
            )}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {t("Solicită anulare", "Request cancel")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Solicită anularea comenzii", "Request order cancellation")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Cererea va fi revizuită de un admin. La aprobare, banii (inclusiv comisionul) se întorc integral chiriașului.",
                  "An admin will review the request. On approval, the renter is fully refunded (including the platform fee).",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="cancel-subject">{t("Subiect", "Subject")}</Label>
                <Input
                  id="cancel-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("Ex: Probleme cu produsul", "E.g., Issue with the product")}
                  maxLength={120}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cancel-reason">{t("Motivul anulării", "Cancellation reason")}</Label>
                <Textarea
                  id="cancel-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("Descrie pe scurt motivul (min. 10 caractere)…", "Briefly describe the reason (min. 10 chars)…")}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="cancel-ack" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
                <Label htmlFor="cancel-ack" className="text-xs leading-snug cursor-pointer">
                  {t(
                    "Înțeleg că cererea va fi revizuită de un admin și că, până la decizie, comanda rămâne activă.",
                    "I understand the request will be reviewed by an admin and the order remains active until then.",
                  )}
                </Label>
              </div>
            </div>
            {formError && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                {t("Renunță", "Cancel")}
              </Button>
              <Button onClick={submitRequest} disabled={busy}>
                {busy ? t("Se trimite…", "Sending…") : t("Trimite cererea", "Send request")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default MutualCancellationCard;
