import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, ChevronDown, Clock, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  rentalId: string;
  phase: "handover" | "return";
  onOpenBlank: () => void;
  t: (ro: string, en: string) => string;
  className?: string;
}

type PhysicalPv = { id: string; file_name: string; status: string; admin_note: string | null; created_at: string };

export default function PhysicalPvUpload({ rentalId, phase, onOpenBlank, t, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: uploads, refetch } = useQuery({
    queryKey: ["physical-pv", rentalId, phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_physical_pvs" as any)
        .select("id, file_name, status, admin_note, created_at")
        .eq("rental_id", rentalId)
        .eq("phase", phase)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PhysicalPv[];
    },
  });
  const latest = uploads?.[0];

  async function submit() {
    if (!file) return;
    setErr(null);
    if (file.size > 15 * 1024 * 1024) return setErr(t("Fișierul depășește 15 MB.", "File exceeds 15 MB."));
    if (!file.type.startsWith("image/") && file.type !== "application/pdf")
      return setErr(t("Acceptăm doar poze sau PDF.", "Only images or PDF are accepted."));
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${rentalId}/physical/${phase}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("rental-pvs").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("rental_physical_pvs" as any).insert({
        rental_id: rentalId, phase, file_path: path, file_name: file.name,
      } as any);
      if (error) throw error;
      setFile(null);
      await refetch();
    } catch (e: any) {
      setErr(e?.message || t("Încărcarea a eșuat.", "Upload failed."));
    } finally {
      setBusy(false);
    }
  }

  const doc = phase === "handover" ? t("PV-ul de predare", "the handover report") : t("PV-ul de returnare", "the return report");

  return (
    <details className={`group rounded-lg border border-dashed border-border bg-background px-3 py-2 ${className}`}>
      <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer list-none">
        <Upload className="h-3.5 w-3.5" />{t("Ai semnat pe hârtie? Încarcă scanul sau poza", "Signed on paper? Upload scan or photo")}
        <ChevronDown className="h-3.5 w-3.5 ml-auto group-open:rotate-180 transition-transform" />
      </summary>
      <ol className="mt-2 space-y-1 text-xs">
        <li>1. <button type="button" className="underline text-primary" onClick={onOpenBlank}>{t("Descarcă setul de documente nesemnat", "Download the unsigned document set")}</button></li>
        <li>2. {t(`Completați și semnați ${doc} pe hârtie, ambele părți`, `Fill in and sign ${doc} on paper, both parties`)}</li>
        <li>3. {t("Fotografiază sau scanează documentul și încarcă-l aici", "Photograph or scan it and upload it here")}</li>
      </ol>
      <p className="mt-2 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium">
        {t("Bunul nu se predă până nu este încărcată în platformă poza sau scanul PV-ului semnat. Până atunci, închirierea nu se consideră începută.",
           "Do not hand over the item until the photo or scan of the signed report is uploaded. Until then, the rental is not considered started.")}
      </p>
      {latest?.status === "approved" ? (
        <div className="mt-3 border-l-2 border-primary bg-primary/10 p-3 text-xs rounded-r-lg">
          <p className="font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{t("PV fizic încărcat și validat", "Physical report uploaded and validated")}</p>
          <p className="text-muted-foreground mt-0.5">{latest.file_name} · {t("Verificat de echipa Rentli.", "Verified by the Rentli team.")}</p>
        </div>
      ) : latest?.status === "pending" ? (
        <div className="mt-3 border-l-2 border-primary bg-primary/10 p-3 text-xs rounded-r-lg">
          <p className="font-semibold flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{t("Trimis spre verificare", "Sent for review")}</p>
          <p className="text-muted-foreground mt-0.5">{latest.file_name} · {format(new Date(latest.created_at), "dd.MM.yyyy HH:mm")}</p>
        </div>
      ) : (
        <>
          {latest?.status === "rejected" && (
            <p className="mt-3 text-xs text-destructive">{t("PV-ul anterior a fost respins", "Previous report was rejected")}{latest.admin_note ? `: ${latest.admin_note}` : "."}</p>
          )}
          <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={(e) => { setErr(null); setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload className="h-4 w-4 mr-1" />{t("Alege poza sau scanul PV-ului", "Choose photo or scan")}
            </Button>
            {file && (
              <Button size="sm" onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                {t("Trimite spre verificare", "Send for review")}
              </Button>
            )}
          </div>
          {file && <p className="mt-2 text-xs text-muted-foreground truncate">{file.name}</p>}
        </>
      )}
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </details>
  );
}
