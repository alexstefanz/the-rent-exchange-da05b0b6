import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Dispute = {
  id: string; public_id: string; status: string; dispute_phase: string | null; dispute_reason: string | null;
  dispute_opened_at: string | null; dispute_opened_by: string | null; owner_id: string | null; renter_id: string | null;
  product_title_snapshot: string | null;
};

/** Open disputes needing admin intervention, with a resolve action that resumes the rental flow. */
export default function AdminOpenDisputesPanel() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin-open-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rentals")
        .select("id, public_id, status, dispute_phase, dispute_reason, dispute_opened_at, dispute_opened_by, owner_id, renter_id, product_title_snapshot")
        .eq("dispute_status", "open").order("dispute_opened_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Dispute[];
    },
    refetchInterval: 30_000,
  });

  if (!data.length) return null;

  const resolve = async (d: Dispute) => {
    if (!confirm(`Rezolvi disputa pentru ${d.public_id} și reiei procesul?`)) return;
    setBusy(d.id); setErr(null);
    const { error } = await supabase.rpc("admin_resolve_rental_dispute", { _rental_id: d.id, _note: notes[d.id] || "" });
    setBusy(null);
    if (error) { setErr(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-open-disputes"] });
  };

  return (
    <section className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="font-semibold">Dispute active ({data.length}) — procesul este blocat până intervii</h2>
      </div>
      {data.map((d) => (
        <div key={d.id} className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <a href={`/inchirieri/${d.public_id}`} target="_blank" rel="noreferrer" className="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1">
              {d.public_id}<ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground">{d.product_title_snapshot}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {d.dispute_phase === "return" ? "Faza de returnare" : "Faza de predare"} · deschisă de {d.dispute_opened_by === d.owner_id ? "proprietar" : "chiriaș"}
              {d.dispute_opened_at && ` · ${format(new Date(d.dispute_opened_at), "dd.MM.yyyy HH:mm")}`}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap rounded-md bg-muted/50 p-2">„{d.dispute_reason}”</p>
          <Textarea rows={2} placeholder="Notă pentru părți (opțional) — decizia echipei Rentli" value={notes[d.id] || ""}
            onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))} maxLength={500} />
          <div className="flex justify-end">
            <Button size="sm" disabled={busy === d.id} onClick={() => resolve(d)}>
              {busy === d.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Rezolvă disputa și reia procesul
            </Button>
          </div>
        </div>
      ))}
      {err && <p className="text-sm text-destructive">{err}</p>}
    </section>
  );
}
