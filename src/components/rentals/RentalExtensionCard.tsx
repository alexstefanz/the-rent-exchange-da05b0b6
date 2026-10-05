import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarPlus, Loader2, AlertTriangle, Check, X, Wallet, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { calcPlatformFee } from "@/lib/rentalPricing";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";

export type RentalExtension = {
  id: string; rental_id: string; requested_days: number; original_end_date: string; requested_end_date: string;
  approved_days: number | null; approved_end_date: string | null; daily_price: number; subtotal_amount: number | null;
  platform_fee: number | null; total_amount: number | null; status: string; payment_status: string; note: string | null;
  rejection_reason: string | null; created_at: string; decided_at: string | null; paid_at: string | null;
};

export function useRentalExtensions(rentalId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["rental-extensions", rentalId],
    queryFn: async () => {
      const { data } = await supabase.from("rental_extensions").select("*").eq("rental_id", rentalId).order("created_at", { ascending: false });
      return (data || []) as RentalExtension[];
    },
  });
  useEffect(() => {
    const ch = supabase.channel(`rental-ext-${rentalId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_extensions", filter: `rental_id=eq.${rentalId}` }, () => {
        qc.invalidateQueries({ queryKey: ["rental-extensions", rentalId] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [rentalId, qc]);
  return q;
}

/** Late-return penalty: 2× daily rent per day past end_date (art. 8). */
export function lateInfo(endDate: string, daily: number, now = new Date()) {
  const days = Math.max(0, differenceInCalendarDays(now, new Date(endDate)));
  return { days, perDay: daily * 2, total: Math.round(days * daily * 2 * 100) / 100 };
}

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd.MM.yyyy") : "—");
const ron = (n?: number | null) => `${Number(n || 0).toFixed(2)} RON`;
const QUICK = [1, 2, 3, 5, 7];

export default function RentalExtensionCard({ rental, role, active }: { rental: RentalFullDetail; role: "owner" | "renter"; active: boolean }) {
  const { language } = useLanguage();
  const t = (r: string, e: string) => (language === "ro" ? r : e);
  const qc = useQueryClient();
  const { data: exts = [] } = useRentalExtensions(rental.id);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(1);
  const [note, setNote] = useState("");
  const [partial, setPartial] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const daily = Number(rental.daily_price || 0);
  const feePct = Number(rental.subtotal) > 0 && Number(rental.platform_fee) > 0 ? 15 : 0;
  const current = exts.find((e) => e.status === "pending" || (e.status === "approved" && e.payment_status === "pending"));
  const late = lateInfo(rental.end_date, daily);
  const sub = days * daily;
  const fee = calcPlatformFee(sub, feePct);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["rental-extensions", rental.id] });
    qc.invalidateQueries({ queryKey: ["rental-detail"] });
  };
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true); setErr(null);
    const { error } = await fn();
    setBusy(false);
    if (error) { setErr(error.message); return false; }
    refresh(); return true;
  };

  // Returning from Stripe Checkout: confirm the card payment once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("ext_session");
    if (!sid) return;
    params.delete("ext_session");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    setBusy(true);
    supabase.functions.invoke("extension-checkout", { body: { action: "verify", session_id: sid } }).then(({ data, error }) => {
      setBusy(false);
      if (error || data?.error) setErr(data?.error || error?.message || "Eroare la confirmarea plății.");
      else if (!data?.paid) setErr(t("Plata cu cardul nu a fost finalizată.", "The card payment was not completed."));
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payByCard = async (extensionId: string) => {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.functions.invoke("extension-checkout", { body: { action: "create", extension_id: extensionId } });
    if (error || data?.error || !data?.url) { setBusy(false); setErr(data?.error || error?.message || "Eroare Stripe."); return; }
    window.location.href = data.url;
  };

  if (!active && !exts.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      {active && late.days > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p>
            {t(`Termenul de returnare (${fmt(rental.end_date)}) a expirat de ${late.days} zile. Conform art. 8 din contract, penalizarea este ${ron(late.perDay)}/zi — total acum ${ron(late.total)}. Suma se trece în Anexa 2.`,
              `The return date (${fmt(rental.end_date)}) passed ${late.days} days ago. Under art. 8, the penalty is ${ron(late.perDay)}/day — currently ${ron(late.total)}. It is recorded in Annex 2.`)}
          </p>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><CalendarPlus className="h-5 w-5" /></span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold">{t("Prelungirea închirierii", "Rental extension")}</h3>
          <p className="text-sm text-muted-foreground">{t(`Data actuală de returnare: ${fmt(rental.end_date)}`, `Current return date: ${fmt(rental.end_date)}`)}</p>
        </div>
        {active && role === "renter" && !current && !open && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}><CalendarPlus className="h-4 w-4 mr-1" />{t("Cere prelungire", "Request extension")}</Button>
        )}
      </div>

      {(() => {
        const lastPaid = exts.find((e) => e.status === "approved" && e.payment_status === "paid");
        const step = open ? 1 : current?.status === "pending" ? 2 : current?.status === "approved" ? 3 : lastPaid ? 6 : 0;
        if (!step) return null;
        const labels = [t("Solicitare", "Request"), t("Răspuns proprietar", "Owner answer"), t("Plată diferență", "Payment"), t("Actualizare asigurare", "Insurance update"), t("Nou termen", "New term")];
        return (
          <>
            <ol className="grid grid-cols-5 gap-1">
              {labels.map((l, i) => {
                const n = i + 1; const done = n < step; const cur = n === step;
                return (
                  <li key={l} className="flex flex-col items-center text-center gap-1">
                    <span className={`h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold ${done ? "bg-primary text-primary-foreground" : cur ? "border-2 border-primary text-primary" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="h-3.5 w-3.5" /> : n}</span>
                    <span className={`text-[10px] leading-tight ${cur || done ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
                  </li>
                );
              })}
            </ol>
            {lastPaid && !current && !open && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium">{t("Poliță de asigurare & Protecție Rentli", "Insurance policy & Rentli protection")} <span className="ml-1 text-[10px] uppercase rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{t("în curând", "coming soon")}</span></p>
                <p className="text-muted-foreground">{t(`Protecția bunului se extinde pentru noul interval: ${fmt(lastPaid.original_end_date)} → ${fmt(lastPaid.approved_end_date)}.`, `Protection extends for the new period: ${fmt(lastPaid.original_end_date)} → ${fmt(lastPaid.approved_end_date)}.`)}</p>
                <p className="font-medium text-primary">{t(`Nou termen de returnare: ${fmt(lastPaid.approved_end_date)}`, `New return date: ${fmt(lastPaid.approved_end_date)}`)}</p>
              </div>
            )}
          </>
        );
      })()}

      {open && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-medium">{t("Cu câte zile vrei să prelungești?", "How many days do you want to add?")}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((d) => (
              <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>+{d}</Button>
            ))}
          </div>
          <div className="text-sm rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between"><span>{t("Noua dată de returnare", "New return date")}</span><b>{fmt(new Date(new Date(rental.end_date).getTime() + days * 86400000).toISOString())}</b></div>
            <div className="flex justify-between"><span>{days} × {ron(daily)}</span><span>{ron(sub)}</span></div>
            <div className="flex justify-between"><span>{t("Comision Rentli", "Rentli fee")}</span><span>{ron(fee)}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1"><span>{t("Total de plată", "Total to pay")}</span><span>{ron(sub + fee)}</span></div>
          </div>
          <Textarea placeholder={t("Mesaj pentru proprietar (opțional)", "Message for the owner (optional)")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setErr(null); }}>{t("Renunță", "Cancel")}</Button>
            <Button size="sm" disabled={busy} onClick={async () => {
              if (await run(() => supabase.rpc("request_rental_extension", { _rental_id: rental.id, _days: days, _note: note || undefined }))) { setOpen(false); setNote(""); }
            }}>{busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{t("Trimite cererea", "Send request")}</Button>
          </div>
        </div>
      )}

      {current && current.status === "pending" && (
        <div className="rounded-xl bg-primary text-primary-foreground p-4 space-y-3 shadow-md">
          <p className="text-sm">
            <b>{t(`Cerere de prelungire: +${current.requested_days} zile`, `Extension request: +${current.requested_days} days`)}</b>{" "}
            ({fmt(current.original_end_date)} → {fmt(current.requested_end_date)})
          </p>
          {current.note && <p className="text-sm text-primary-foreground/85 italic">„{current.note}”</p>}
          {role === "renter" ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-primary-foreground/90">{t("Se așteaptă răspunsul proprietarului.", "Waiting for the owner's answer.")}</p>
              <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" disabled={busy} onClick={() => run(() => supabase.rpc("cancel_rental_extension", { _extension_id: current.id }))}>{t("Anulează cererea", "Cancel request")}</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {current.requested_days > 1 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>{t("Aprobă parțial:", "Approve partially:")}</span>
                  {Array.from({ length: current.requested_days - 1 }, (_, i) => i + 1).map((d) => (
                    <Button key={d} size="sm" variant="outline" className={partial === d ? "bg-primary-foreground text-primary border-primary-foreground hover:bg-primary-foreground hover:text-primary" : "bg-transparent text-primary-foreground border-primary-foreground/60 hover:bg-primary-foreground/15 hover:text-primary-foreground"} onClick={() => setPartial(partial === d ? null : d)}>{d} {t("zile", "days")}</Button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/60 hover:bg-primary-foreground/15 hover:text-primary-foreground" disabled={busy} onClick={() => run(() => supabase.rpc("decide_rental_extension", { _extension_id: current.id, _approved_days: 0 }))}><X className="h-4 w-4 mr-1" />{t("Refuză", "Decline")}</Button>
                {partial && (
                  <Button size="sm" variant="outline" className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground" disabled={busy} onClick={() => run(() => supabase.rpc("decide_rental_extension", { _extension_id: current.id, _approved_days: partial }))}>{t(`Aprobă ${partial} zile`, `Approve ${partial} days`)}</Button>
                )}
                <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" disabled={busy} onClick={() => run(() => supabase.rpc("decide_rental_extension", { _extension_id: current.id, _approved_days: current.requested_days }))}><Check className="h-4 w-4 mr-1" />{t("Aprobă total", "Approve all")}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {current && current.status === "approved" && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-2 text-sm">
          <p><b>{t(`Prelungire aprobată: +${current.approved_days} zile`, `Extension approved: +${current.approved_days} days`)}</b> → {fmt(current.approved_end_date)}</p>
          <p>{t("De plată", "To pay")}: <b>{ron(current.total_amount)}</b> ({ron(current.subtotal_amount)} + {t("comision", "fee")} {ron(current.platform_fee)})</p>
          {role === "renter" ? (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => supabase.rpc("cancel_rental_extension", { _extension_id: current.id }))}>{t("Renunț", "Cancel")}</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => supabase.rpc("pay_rental_extension_with_wallet", { _extension_id: current.id }))}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wallet className="h-4 w-4 mr-1" />}{t("Plătește din portofel", "Pay from wallet")}
              </Button>
              <Button size="sm" disabled={busy} onClick={() => payByCard(current.id)}>
                <CreditCard className="h-4 w-4 mr-1" />{t("Plătește cu cardul", "Pay by card")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("Se așteaptă plata chiriașului.", "Waiting for the renter's payment.")}</p>
          )}
        </div>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}

      {exts.filter((e) => e !== current).length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {exts.filter((e) => e !== current).map((e) => (
            <li key={e.id} className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {e.status === "approved" && e.payment_status === "paid"
                ? t(`Act adițional: +${e.approved_days} zile până la ${fmt(e.approved_end_date)} (${ron(e.total_amount)})`, `Addendum: +${e.approved_days} days until ${fmt(e.approved_end_date)} (${ron(e.total_amount)})`)
                : e.status === "rejected" ? t(`Cerere +${e.requested_days} zile refuzată`, `Request +${e.requested_days} days declined`)
                : t(`Cerere +${e.requested_days} zile anulată`, `Request +${e.requested_days} days cancelled`)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
