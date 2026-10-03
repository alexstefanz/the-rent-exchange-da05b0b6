import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ExternalLink, Loader2, MapPin, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const slotLabel = (s: string) => `${s}–${String(Number(s.slice(0, 2)) + 2).padStart(2, "0")}:00`;

interface Proposal {
  proposed_by?: "owner" | "renter";
  time?: string;
  place?: string;
  owner_confirmed_at?: string | null;
  renter_confirmed_at?: string | null;
}

interface Props {
  rentalId: string;
  role: "owner" | "renter";
  startDate: string;
  defaultPlace?: string | null;
  onOpenChat: () => void;
  t: (ro: string, en: string) => string;
}

export default function MeetingDetailsCard({ rentalId, role, startDate, defaultPlace, onOpenChat, t }: Props) {
  const { data, refetch } = useQuery({
    queryKey: ["rental-meeting", rentalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("pickup_proposal, pickup_agreed_at")
        .eq("id", rentalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const proposal: Proposal = ((data?.pickup_proposal as any) || {}) as Proposal;
  const agreed = !!data?.pickup_agreed_at;
  const hasProposal = !!proposal.time;
  const myConfirmed = role === "owner" ? !!proposal.owner_confirmed_at : !!proposal.renter_confirmed_at;

  const initialSlot = proposal.time ? format(new Date(proposal.time), "HH:mm") : "";
  const [editing, setEditing] = useState(false);
  const [slot, setSlot] = useState<string>(SLOTS.includes(initialSlot) ? initialSlot : "");
  const [place, setPlace] = useState<string>(proposal.place || defaultPlace || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const showForm = !agreed && (!hasProposal || editing);
  const day = new Date(startDate);
  const mapsUrl = (p: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p)}`;

  async function propose() {
    setErr(null);
    if (!slot) return setErr(t("Alege un interval orar.", "Choose a time slot."));
    if (place.trim().length < 5) return setErr(t("Completează adresa întâlnirii (minim 5 caractere).", "Enter the meeting address (min 5 characters)."));
    setBusy(true);
    try {
      const [h, m] = slot.split(":").map(Number);
      const dt = new Date(day);
      dt.setHours(h, m, 0, 0);
      const { error } = await supabase.rpc("propose_pickup" as any, {
        _rental_id: rentalId,
        _pickup_time: dt.toISOString(),
        _pickup_place: place.trim(),
      });
      if (error) throw error;
      setEditing(false);
      await refetch();
    } catch (e: any) {
      setErr(e?.message || t("Nu am putut salva propunerea.", "Could not save the proposal."));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.rpc("confirm_pickup" as any, { _rental_id: rentalId });
      if (error) throw error;
      await refetch();
    } catch (e: any) {
      setErr(e?.message || t("Nu am putut confirma.", "Could not confirm."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-semibold">{t("Detalii întâlnire", "Meeting details")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("Predarea are loc pe", "Handover takes place on")}{" "}
            <span className="font-medium text-foreground">{format(day, "EEEE, d MMMM yyyy", { locale: roLocale })}</span>
          </p>
        </div>
        {agreed && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />{t("Stabilit", "Agreed")}
          </span>
        )}
      </div>

      {showForm ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("Interval orar de predare", "Handover time slot")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    slot === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {slotLabel(s)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t("Locul întâlnirii", "Meeting place")}</p>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t("Stradă, număr, oraș", "Street, number, city")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={propose} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("Trimite propunerea", "Send proposal")}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>{t("Renunță", "Cancel")}</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{t("Interval orar", "Time slot")}</p>
              <p className="font-semibold">{proposal.time ? slotLabel(format(new Date(proposal.time), "HH:mm")) : "—"}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{t("Locul întâlnirii", "Meeting place")}</p>
              <p className="font-semibold break-words">{proposal.place || "—"}</p>
              {proposal.place && (
                <a href={mapsUrl(proposal.place)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <MapPin className="h-3 w-3" />{t("Deschide în Google Maps", "Open in Google Maps")}<ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {!agreed && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
              {myConfirmed ? (
                <p className="text-muted-foreground">
                  {t("Ai trimis propunerea. Așteptăm confirmarea celeilalte părți.", "Proposal sent. Waiting for the other party to confirm.")}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {t("Discutați detaliile în chat, apoi confirmați că sunteți de acord.", "Discuss the details in chat, then confirm you agree.")}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!agreed && !myConfirmed && (
              <Button onClick={confirm} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {t("Am discutat — confirm detaliile", "We talked — confirm details")}
              </Button>
            )}
            <Button variant="outline" onClick={onOpenChat}>
              <MessageSquare className="h-4 w-4 mr-2" />{t("Discută în chat", "Chat")}
            </Button>
            {!agreed && (
              <Button variant="ghost" onClick={() => setEditing(true)} disabled={busy}>
                {t("Propune altă variantă", "Propose another option")}
              </Button>
            )}
          </div>
        </div>
      )}

      {err && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
    </section>
  );
}
