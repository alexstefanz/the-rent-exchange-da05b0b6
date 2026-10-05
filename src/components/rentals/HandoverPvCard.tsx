import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, startOfDay } from "date-fns";
import { Camera, CheckCircle2, ChevronDown, FileCheck, FileSignature, Loader2, Lock, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  rentalId: string;
  startDate: string;
  signed: boolean;
  onOpenPv: () => void;
  onOpenBlank: () => void;
  t: (ro: string, en: string) => string;
}

type PhysicalPv = { id: string; file_name: string; status: string; admin_note: string | null; created_at: string };

export default function HandoverPvCard({ rentalId, startDate, signed, onOpenPv, onOpenBlank, t }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const { data: uploads, refetch } = useQuery({
    queryKey: ["physical-pv", rentalId, "handover"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_physical_pvs" as any)
        .select("id, file_name, status, admin_note, created_at")
        .eq("rental_id", rentalId)
        .eq("phase", "handover")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PhysicalPv[];
    },
  });
  const latest = uploads?.[0];

  const locked = isAfter(startOfDay(new Date(startDate)), startOfDay(new Date()));
  const badge = signed
    ? { l: t("Semnat", "Signed"), c: "bg-primary/15 text-primary" }
    : locked
      ? { l: t(`Disponibil pe ${format(new Date(startDate), "dd.MM.yyyy")}`, `Available on ${format(new Date(startDate), "dd.MM.yyyy")}`), c: "bg-muted text-muted-foreground" }
      : { l: t("Disponibil acum", "Available now"), c: "bg-primary/15 text-primary" };
  const Icon = signed ? FileCheck : locked ? Lock : FileSignature;

  async function submit() {
    if (!file) return;
    setErr(null);
    if (file.size > 15 * 1024 * 1024) return setErr(t("Fișierul depășește 15 MB.", "File exceeds 15 MB."));
    if (!file.type.startsWith("image/") && file.type !== "application/pdf")
      return setErr(t("Acceptăm doar poze sau PDF.", "Only images or PDF are accepted."));
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${rentalId}/physical/handover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("rental-pvs").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("rental_physical_pvs" as any).insert({
        rental_id: rentalId, phase: "handover", file_path: path, file_name: file.name,
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

  if (signed && collapsed) {
    return (
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div
          role="button"
          aria-expanded={false}
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 rounded-2xl"
        >
          <span className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><CheckCircle2 className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-semibold text-sm">{t("Proces-verbal de predare", "Handover report")}</p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              {t("Semnat de ambele părți · Vezi detalii", "Signed by both parties · View details")}
              <ChevronDown className="h-3.5 w-3.5" />
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpenPv(); }}>
            <FileSignature className="h-4 w-4 mr-1" />{t("Vezi anexa", "View annex")}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-primary bg-card p-4 shadow-sm">
      {signed && (
        <button type="button" onClick={() => setCollapsed(true)} className="mb-2 text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          {t("Ascunde detaliile", "Hide details")}<ChevronDown className="h-3.5 w-3.5 rotate-180" />
        </button>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-sm">{t("Proces-verbal de predare", "Handover report")}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.c}`}>{badge.l}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {signed ? t("Semnat de ambele părți — predarea e confirmată.", "Signed by both parties — handover confirmed.")
              : t("Obligatoriu · Fotografiați bunul, apoi semnați PV-ul.", "Required · Photograph the item, then sign.")}
          </p>
        </div>
        <Button size="sm" onClick={onOpenPv} className="w-full sm:w-auto">
          {signed ? <FileSignature className="h-4 w-4 mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
          {signed ? t("Vezi anexa", "View annex") : t("Fotografii & PV", "Photos & report")}
        </Button>
      </div>

      {!signed && <PhysicalPvUpload rentalId={rentalId} phase="handover" onOpenBlank={onOpenBlank} t={t} className="mt-3" />}
    </section>
  );
}
