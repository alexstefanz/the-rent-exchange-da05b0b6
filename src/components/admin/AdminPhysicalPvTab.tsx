import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PV_REASONS } from "@/components/rentals/PhysicalPvUpload";

type Row = {
  id: string; phase: string; file_path: string; file_name: string; status: string;
  admin_note: string | null; reason: string; reason_details: string | null; created_at: string; reviewed_at: string | null;
};

export default function AdminPhysicalPvTab({ rentalId }: { rentalId: string }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-physical-pv", rentalId],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_physical_pvs" as any)
        .select("id, phase, file_path, file_name, status, admin_note, reason, reason_details, created_at, reviewed_at")
        .eq("rental_id", rentalId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  async function open(path: string) {
    const { data, error } = await supabase.storage.from("rental-pvs").createSignedUrl(path, 300);
    if (error || !data) return setErr(error?.message ?? "Nu s-a putut deschide fișierul.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function review(id: string, status: "approved" | "rejected") {
    setErr(null);
    if (status === "rejected" && !notes[id]?.trim()) return setErr("Adaugă o notă pentru respingere.");
    setBusy(id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("rental_physical_pvs" as any).update({
      status, admin_note: notes[id]?.trim() || null, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString(),
    } as any).eq("id", id);
    setBusy(null);
    if (error) return setErr(error.message);
    refetch();
  }

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">Niciun PV fizic încărcat pentru această rezervare.</p>;

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-destructive">{err}</p>}
      {data.map((r) => {
        const reason = PV_REASONS.find((x) => x.value === r.reason)?.ro ?? r.reason;
        return (
          <div key={r.id} className="rounded-lg border bg-card p-3 text-sm space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{r.phase === "handover" ? "Predare" : "Returnare"}</Badge>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                {r.status === "approved" ? "Validat" : r.status === "rejected" ? "Respins" : "În așteptare"}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd.MM.yyyy HH:mm")}</span>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => open(r.file_path)}>Deschide {r.file_name}</Button>
            </div>
            <p><span className="text-muted-foreground">Motiv tehnic:</span> <strong>{reason}</strong>{r.reason_details ? ` — ${r.reason_details}` : ""}</p>
            {r.status === "pending" ? (
              <div className="space-y-2">
                <input value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  placeholder="Notă (obligatorie la respingere)" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                <p className="text-xs text-muted-foreground">
                  Validarea confirmă automat {r.phase === "handover" ? "predarea (închirierea devine activă)" : "returnarea (închirierea se finalizează)"}.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => { if (confirm(r.phase === "handover" ? "Validezi PV-ul fizic? Predarea va fi confirmată și închirierea devine activă." : "Validezi PV-ul fizic? Returnarea va fi confirmată și închirierea se finalizează.")) review(r.id, "approved"); }}>Validează</Button>
                  <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => review(r.id, "rejected")}>Respinge</Button>
                </div>
              </div>
            ) : r.admin_note && <p className="text-xs text-muted-foreground">Notă admin: {r.admin_note}</p>}
          </div>
        );
      })}
    </div>
  );
}
