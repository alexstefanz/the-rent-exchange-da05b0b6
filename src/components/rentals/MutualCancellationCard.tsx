import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Ban, Clock, MessageCircleWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { requestMutualCancellation, respondMutualCancellation } from "@/features/rentals/rentalsApi";

interface Props {
  rentalId: string;
  cancelRequestStatus?: string | null;
  cancelRequestInitiator?: string | null;
  cancelRequestReason?: string | null;
  initiatorName?: string | null;
  counterpartyName?: string | null;
  currentUserId: string;
  onChanged: () => void | Promise<void>;
}

const MutualCancellationCard = ({
  rentalId, cancelRequestStatus, cancelRequestInitiator, cancelRequestReason,
  initiatorName, counterpartyName, currentUserId, onChanged,
}: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const isPending = cancelRequestStatus === "pending";
  const iAmInitiator = isPending && cancelRequestInitiator === currentUserId;
  const iAmRecipient = isPending && cancelRequestInitiator && cancelRequestInitiator !== currentUserId;

  async function submitRequest() {
    if (reason.trim().length < 10) {
      toast.error(t("Te rugăm să oferi un motiv (minim 10 caractere).", "Please provide a reason (min 10 characters)."));
      return;
    }
    if (!accepted) {
      toast.error(t("Confirmă că este nevoie de aprobarea celeilalte părți.", "Please confirm that the other party must approve."));
      return;
    }
    setBusy(true);
    try {
      await requestMutualCancellation(rentalId, reason.trim());
      toast.success(t("Solicitare trimisă. Așteptăm răspunsul celeilalte părți.", "Request sent. Awaiting the other party's response."));
      setOpen(false); setReason(""); setAccepted(false);
      await onChanged();
    } catch (e: any) {
      toast.error(e?.message || t("Eroare la trimitere.", "Error sending request."));
    } finally { setBusy(false); }
  }

  async function approve() {
    if (!confirm(t("Confirmi anularea comenzii? Banii (inclusiv comisionul) vor fi rambursați chiriașului.", "Confirm cancellation? The renter will be fully refunded (including the platform fee)."))) return;
    setBusy(true);
    try {
      await respondMutualCancellation(rentalId, "approve");
      toast.success(t("Anulare aprobată. Refundul a fost inițiat.", "Cancellation approved. Refund initiated."));
      await onChanged();
    } catch (e: any) {
      toast.error(e?.message || t("Eroare la aprobare.", "Error approving."));
    } finally { setBusy(false); }
  }

  async function reject() {
    setBusy(true);
    try {
      await respondMutualCancellation(rentalId, "reject", rejectNote.trim() || undefined);
      toast.success(t("Solicitare refuzată.", "Request rejected."));
      setRejectOpen(false); setRejectNote("");
      await onChanged();
    } catch (e: any) {
      toast.error(e?.message || t("Eroare la refuz.", "Error rejecting."));
    } finally { setBusy(false); }
  }

  async function withdraw() {
    if (!confirm(t("Retragi solicitarea de anulare?", "Withdraw your cancellation request?"))) return;
    setBusy(true);
    try {
      await respondMutualCancellation(rentalId, "withdraw");
      toast.success(t("Solicitare retrasă.", "Request withdrawn."));
      await onChanged();
    } catch (e: any) {
      toast.error(e?.message || t("Eroare.", "Error."));
    } finally { setBusy(false); }
  }

  // State 1: no pending request
  if (!isPending) {
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
                "Poți solicita anularea comenzii cu acordul celeilalte părți. Disponibil până la semnarea PV de predare.",
                "You can request a mutual cancellation. Available until the handover PV is signed.",
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
                    "Cealaltă parte va primi cererea și o poate aproba sau refuza. La aprobare, banii (inclusiv comisionul) se întorc integral chiriașului.",
                    "The other party will receive the request and can approve or reject it. On approval, the renter is fully refunded (including the platform fee).",
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
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
                      "Înțeleg că anularea necesită aprobarea celeilalte părți și că, până la aprobare, comanda rămâne activă.",
                      "I understand the cancellation requires the other party's approval and remains active until then.",
                    )}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                  {t("Renunță", "Cancel")}
                </Button>
                <Button onClick={submitRequest} disabled={busy}>
                  {busy ? t("Se trimite…", "Sending…") : t("Trimite solicitarea", "Send request")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    );
  }

  // State 2: pending, I am the initiator
  if (iAmInitiator) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 grid place-items-center shrink-0">
            <Clock className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-900">
              {t(`Solicitare trimisă către ${counterpartyName || "cealaltă parte"}`, `Request sent to ${counterpartyName || "the other party"}`)}
            </h3>
            <p className="text-xs text-amber-900/80 mt-1">
              {t("Așteptăm răspunsul. Poți retrage solicitarea oricând.", "Waiting for a response. You can withdraw the request at any time.")}
            </p>
            {cancelRequestReason && (
              <p className="text-xs mt-2 text-amber-900 bg-white/60 rounded-lg p-2 border border-amber-200">
                <span className="font-semibold">{t("Motiv:", "Reason:")}</span> {cancelRequestReason}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={withdraw} disabled={busy}>
            {t("Retrage", "Withdraw")}
          </Button>
        </div>
      </section>
    );
  }

  // State 3: pending, I am the recipient
  if (iAmRecipient) {
    return (
      <section className="rounded-2xl border-2 border-[#F98715] bg-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F98715]/15 grid place-items-center shrink-0">
            <MessageCircleWarning className="h-5 w-5 text-[#F98715]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {t(`${initiatorName || "Cealaltă parte"} a solicitat anularea comenzii`, `${initiatorName || "The other party"} requested to cancel the order`)}
            </h3>
            {cancelRequestReason && (
              <p className="text-xs mt-2 bg-white rounded-lg p-2 border border-orange-200">
                <span className="font-semibold">{t("Motiv:", "Reason:")}</span> {cancelRequestReason}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {t("Dacă aprobi, comanda se anulează și banii (inclusiv comisionul) se întorc integral chiriașului.", "If you approve, the order is cancelled and the renter is fully refunded (including the platform fee).")}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button onClick={approve} disabled={busy} size="sm">
                {busy ? t("Se procesează…", "Processing…") : t("Aprobă anularea", "Approve cancellation")}
              </Button>
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={busy}>{t("Refuză", "Reject")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("Refuză cererea de anulare", "Reject cancellation request")}</DialogTitle>
                    <DialogDescription>
                      {t("Poți adăuga o notă pentru cealaltă parte (opțional).", "You can add a note for the other party (optional).")}
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} />
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={busy}>
                      {t("Renunță", "Cancel")}
                    </Button>
                    <Button variant="destructive" onClick={reject} disabled={busy}>
                      {busy ? t("Se trimite…", "Sending…") : t("Refuză cererea", "Reject request")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
};

export default MutualCancellationCard;