import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays, addDays, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, MessageSquare, Check, X, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestEarlyReturn, respondEarlyReturn } from "@/features/rentals/ownerRentalsApi";

interface Props {
  rentalId: string;
  role: "owner" | "renter";
  startDate: string; // ISO date
  endDate: string;   // ISO date
  dailyPrice: number;
  subtotal: number;
  onOpenChat: () => void;
  t: (ro: string, en: string) => string;
}

interface EarlyReturnState {
  early_return_status: string | null;
  early_return_initiator: string | null;
  early_return_reason: string | null;
  early_return_new_end_date: string | null;
  early_return_new_subtotal: number | null;
  early_return_new_rental_days: number | null;
  early_return_refund_amount: number | null;
  early_return_renter_approved_at: string | null;
  early_return_owner_approved_at: string | null;
  early_return_requested_at: string | null;
  renter_id: string;
  owner_id: string;
}

export default function EarlyReturnCard({ rentalId, role, startDate, endDate, dailyPrice, subtotal, onOpenChat, t }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState<"approve" | "reject" | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["earlyReturn", rentalId],
    queryFn: async (): Promise<EarlyReturnState | null> => {
      const { data, error } = await supabase
        .from("rentals")
        .select("early_return_status, early_return_initiator, early_return_reason, early_return_new_end_date, early_return_new_subtotal, early_return_new_rental_days, early_return_refund_amount, early_return_renter_approved_at, early_return_owner_approved_at, early_return_requested_at, renter_id, owner_id")
        .eq("id", rentalId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 30_000,
  });

  // Today (midnight) and rental bounds
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // Calendar bounds: returnul anticipat poate fi între azi și ziua dinaintea end_date.
  // Pentru predare anticipată (handover înainte de start_date), `today < start` e ok —
  // permitem returnarea oricând după ce produsul e deja la chiriaș.
  const maxDate = addDays(end, -1);
  const earliest = today;

  const status = data?.early_return_status ?? "none";
  const hasActive = status === "pending" || status === "accepted";

  // Pending: show status card with approval buttons
  if (status === "pending" && data) {
    const isInitiator = data.early_return_initiator
      ? (role === "renter" ? data.early_return_initiator === data.renter_id : data.early_return_initiator === data.owner_id)
      : false;
    const renterApproved = !!data.early_return_renter_approved_at;
    const ownerApproved = !!data.early_return_owner_approved_at;
    const myApproved = role === "renter" ? renterApproved : ownerApproved;

    const handle = async (action: "approve" | "reject") => {
      setResponding(action);
      try {
        await respondEarlyReturn(rentalId, action);
        toast.success(action === "approve"
          ? t("Ai aprobat cererea de returnare anticipată.", "You approved the early return request.")
          : t("Ai respins cererea.", "You rejected the request."));
        await refetch();
        qc.invalidateQueries({ queryKey: ["ownerRentals"] });
      } catch (e: any) {
        toast.error(e?.message || t("Eroare", "Error"));
      } finally {
        setResponding(null);
      }
    };

    return (
      <section className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7]/40 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-[#F59E0B]" />
          <h3 className="font-heading font-semibold">
            {t("Cerere returnare anticipată", "Early return request")}
          </h3>
          <Badge variant="secondary">{t("În așteptare", "Pending")}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-xs text-muted-foreground">{t("Data nouă propusă", "Proposed new end date")}</p>
            <p className="font-semibold">{data.early_return_new_end_date ? format(parseISO(data.early_return_new_end_date), "dd.MM.yyyy") : "—"}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-xs text-muted-foreground">{t("Rambursare estimată", "Estimated refund")}</p>
            <p className="font-semibold">{Number(data.early_return_refund_amount ?? 0).toFixed(2)} RON</p>
          </div>
        </div>

        {data.early_return_reason && (
          <div className="rounded-md bg-background border border-border p-3 text-sm mb-3">
            <span className="text-muted-foreground">{t("Motiv: ", "Reason: ")}</span>
            <span className="text-foreground whitespace-pre-wrap">{data.early_return_reason}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
          <span className="flex items-center gap-1">
            {renterApproved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
            {t("Chiriaș", "Renter")}: {renterApproved ? format(parseISO(data.early_return_renter_approved_at!), "dd.MM HH:mm") : t("în așteptare", "pending")}
          </span>
          <span className="flex items-center gap-1">
            {ownerApproved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
            {t("Proprietar", "Owner")}: {ownerApproved ? format(parseISO(data.early_return_owner_approved_at!), "dd.MM HH:mm") : t("în așteptare", "pending")}
          </span>
        </div>

        {!myApproved && !isInitiator && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handle("approve")} disabled={responding !== null} className="bg-[#F59E0B] hover:bg-[#F98715]">
              {responding === "approve" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {t("Aprobă", "Approve")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handle("reject")} disabled={responding !== null}>
              {responding === "reject" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
              {t("Respinge", "Reject")}
            </Button>
          </div>
        )}
        {isInitiator && !((renterApproved && ownerApproved)) && (
          <p className="text-xs text-muted-foreground">
            {t("Ai trimis cererea. Aștepți confirmarea celuilalt participant.", "You sent the request. Waiting for the other party.")}
          </p>
        )}
      </section>
    );
  }

  // Accepted: small banner
  if (status === "accepted" && data) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-700" />
          <p className="text-sm text-emerald-900">
            {t(
              `Returnare anticipată aprobată. Noua dată: ${data.early_return_new_end_date ? format(parseISO(data.early_return_new_end_date), "dd.MM.yyyy") : "—"}. Rambursare: ${Number(data.early_return_refund_amount ?? 0).toFixed(2)} RON.`,
              `Early return approved. New end date: ${data.early_return_new_end_date ? format(parseISO(data.early_return_new_end_date), "dd.MM.yyyy") : "—"}. Refund: ${Number(data.early_return_refund_amount ?? 0).toFixed(2)} RON.`,
            )}
          </p>
        </div>
      </section>
    );
  }

  // Default: prompt card with chat + request button.
  // Dacă suntem deja peste sau în ultima zi a perioadei, nu mai e „early" — ascundem.
  if (today >= maxDate) return null;

  const newDays = selectedDate
    ? Math.max(1, differenceInCalendarDays(selectedDate, start) + 1)
    : 0;
  const newSubtotal = newDays > 0 ? Math.round(dailyPrice * newDays * 100) / 100 : 0;
  const refund = Math.max(0, Math.round((subtotal - newSubtotal) * 100) / 100);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error(t("Alege o dată nouă de returnare.", "Pick a new return date."));
      return;
    }
    if (reason.trim().length < 20) {
      toast.error(t("Motivul trebuie să aibă minim 20 de caractere.", "Reason must be at least 20 characters."));
      return;
    }
    setSubmitting(true);
    try {
      const iso = format(selectedDate, "yyyy-MM-dd");
      await requestEarlyReturn(rentalId, { reason: reason.trim(), newEndDate: iso });
      toast.success(t("Cerere trimisă. Așteptăm aprobarea celuilalt participant.", "Request sent. Waiting for the other party to approve."));
      setDialogOpen(false);
      setSelectedDate(undefined);
      setReason("");
      await refetch();
      qc.invalidateQueries({ queryKey: ["ownerRentals"] });
    } catch (e: any) {
      toast.error(e?.message || t("Eroare la trimitere.", "Submission error."));
    } finally {
      setSubmitting(false);
    }
  };

  const promptTitle = role === "renter"
    ? t("Vrei să predai produsul înainte de termen?", "Want to return the product earlier than planned?")
    : t("Vrei să ceri înapoi produsul înainte de termen?", "Want to ask for the product back earlier than planned?");
  const promptHint = role === "renter"
    ? t("Discută cu proprietarul, apoi solicită returnarea anticipată cu data și prețul recalculat.", "Chat with the owner first, then send an early-return request with the new date and recalculated price.")
    : t("Discută cu chiriașul, apoi solicită returnarea anticipată cu data și prețul recalculat.", "Chat with the renter first, then send an early-return request with the new date and recalculated price.");

  return (
    <>
      <section className="rounded-2xl border-2 border-[#F59E0B]/40 bg-[#FEF3C7]/30 p-5 shadow-sm mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#F59E0B]/20 grid place-items-center shrink-0">
              <CalendarDays className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{promptTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{promptHint}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button variant="outline" onClick={onOpenChat} className="sm:flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              {role === "renter"
                ? t("Discută cu Proprietarul", "Chat with Owner")
                : t("Discută cu Chiriașul", "Chat with Renter")}
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="sm:flex-1 bg-[#F59E0B] hover:bg-[#F98715]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("Solicită returnare anticipată", "Request early return")}
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Returnare anticipată", "Early return")}</DialogTitle>
            <DialogDescription>
              {t(
                `Alege o dată între ${format(earliest, "dd.MM")} și ${format(maxDate, "dd.MM")}. Prețul este recalculat automat în funcție de zilele efectiv folosite.`,
                `Pick a date between ${format(earliest, "dd.MM")} and ${format(maxDate, "dd.MM")}. The price is recalculated based on days actually used.`,
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">{t("Data nouă de returnare", "New return date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal mt-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, "dd.MM.yyyy") : t("Alege o dată", "Pick a date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(d) => d < earliest || d > maxDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="early-reason" className="text-xs">
                {t("Motiv (minim 20 caractere)", "Reason (min 20 chars)")}
              </Label>
              <Textarea
                id="early-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("Ex: am terminat proiectul mai devreme și vreau să returnez bunul.", "Ex: I finished the project earlier and want to return the item.")}
                maxLength={500}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{reason.length}/500</p>
            </div>

            {selectedDate && (
              <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Zile inițiale", "Initial days")}</span>
                  <span>{differenceInCalendarDays(end, start) + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Zile noi", "New days")}</span>
                  <span className="font-medium">{newDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Subtotal nou", "New subtotal")}</span>
                  <span>{newSubtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="font-semibold">{t("Rambursare estimată", "Estimated refund")}</span>
                  <span className="font-semibold text-emerald-700">{refund.toFixed(2)} RON</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  {t("Comisionul platformei rămâne calculat pe subtotalul inițial.", "Platform fee stays calculated on the initial subtotal.")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t("Anulează", "Cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !selectedDate || reason.trim().length < 20} className="bg-[#F59E0B] hover:bg-[#F98715]">
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {t("Trimite cerere", "Send request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
