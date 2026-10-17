import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  rental: any;
  isOwner: boolean;
  t: (ro: string, en: string) => string;
}

/** Shows once per rental+user a blocking popup that the rental was cancelled, and by whom. */
export default function CancelledRentalModal({ rental, isOwner, t }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const closed = rental && (rental.status === "cancelled" || rental.status === "rejected");
  const key = rental ? `rentli-cancel-seen-${rental.id}-${isOwner ? "o" : "r"}` : "";

  useEffect(() => {
    if (!closed || !key) return;
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch { setOpen(true); }
  }, [closed, key]);

  if (!closed) return null;

  const reason = String(rental.cancellation_reason || "");
  const by = String(rental.cancelled_by || "");
  const expired = reason.startsWith("Cerere expirată automat");
  const byOwner = !expired && (rental.status === "rejected" || reason === "owner_self_unpaid" || by === "owner" || (by && by === rental.owner_id));
  const byRenter = !expired && !byOwner && (reason === "renter_self_unpaid" || by === "renter" || (by && by === rental.renter_id));
  const byAdmin = !expired && !byOwner && !byRenter && (reason === "admin_self_unpaid" || rental.cancel_request_status === "approved");
  const wasPaid = ["authorized", "paid", "captured", "refunded", "refund_pending"].includes(String(rental.payment_status)) || Number(rental.wallet_credit_applied || 0) > 0;

  const title = rental.status === "rejected"
    ? t("CEREREA A FOST REFUZATĂ DE PROPRIETAR", "REQUEST DECLINED BY OWNER")
    : expired ? t("CEREREA A EXPIRAT AUTOMAT", "REQUEST EXPIRED AUTOMATICALLY")
    : byOwner ? (isOwner ? t("AI ANULAT REZERVAREA", "YOU CANCELLED THE BOOKING") : t("REZERVAREA A FOST ANULATĂ DE PROPRIETAR", "BOOKING CANCELLED BY OWNER"))
    : byRenter ? (isOwner ? t("REZERVAREA A FOST ANULATĂ DE CHIRIAȘ", "BOOKING CANCELLED BY RENTER") : t("AI ANULAT REZERVAREA", "YOU CANCELLED THE BOOKING"))
    : byAdmin ? t("REZERVAREA A FOST ANULATĂ DE ECHIPA RENTLI", "BOOKING CANCELLED BY RENTLI")
    : t("REZERVAREA A FOST ANULATĂ", "BOOKING CANCELLED");

  const counterparty = isOwner ? rental.renter_name : rental.owner_name;
  const who = expired
    ? t("Proprietarul nu a răspuns în 24 de ore, așa că cererea s-a anulat automat.", "The owner did not respond within 24 hours, so the request was cancelled automatically.")
    : byOwner && !isOwner ? t(`Proprietarul${counterparty ? ` (${counterparty})` : ""} a anulat procesul de închiriere.`, `The owner${counterparty ? ` (${counterparty})` : ""} cancelled the rental.`)
    : byRenter && isOwner ? t(`Chiriașul${counterparty ? ` (${counterparty})` : ""} a anulat procesul de închiriere.`, `The renter${counterparty ? ` (${counterparty})` : ""} cancelled the rental.`)
    : byAdmin ? t("Anularea a fost aprobată de echipa Rentli.", "The cancellation was approved by the Rentli team.")
    : t("Procesul de închiriere a fost oprit.", "The rental process was stopped.");

  const money = isOwner
    ? t("Produsul tău redevine disponibil pentru alte rezervări.", "Your item is available for other bookings again.")
    : wasPaid
      ? t("Suma plătită îți este returnată (în Wallet sau pe card).", "The paid amount is being returned to you (Wallet or card).")
      : t("Nu ai fost taxat. Nicio sumă nu a fost retrasă.", "You were not charged.");

  const close = () => {
    try { localStorage.setItem(key, "1"); } catch {}
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md overflow-x-hidden">
        <DialogHeader className="min-w-0">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center text-destructive break-words leading-snug">{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 flex w-full min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3 text-left">
              {rental.product_image && (
                <img
                  src={rental.product_image}
                  alt={rental.product_title || ""}
                  className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{rental.product_title}</p>
                <p className="text-xs font-mono text-muted-foreground">{rental.public_id}</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-2 break-words rounded-xl bg-muted/60 p-4 text-sm text-foreground/80">
          <p>{who}</p>
          {rental.rejection_reason && <p className="italic">„{rental.rejection_reason}”</p>}
          <p>{money}</p>
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:space-x-0">
          <Button variant="outline" className="w-full" onClick={() => { close(); navigate(isOwner ? "/inchirieri" : "/rezervari"); }}>
            {isOwner ? t("Închirierile mele", "My rentals") : t("Rezervările mele", "My bookings")}
          </Button>
          <Button className="w-full" onClick={close}>{t("Am înțeles", "Got it")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
