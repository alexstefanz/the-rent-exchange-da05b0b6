import { useState } from "react";
import { format, isAfter, startOfDay } from "date-fns";
import { Camera, CheckCircle2, ChevronDown, FileCheck, FileSignature, Loader2, Lock, Upload, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhysicalPvUpload from "./PhysicalPvUpload";

interface Props {
  rentalId: string;
  startDate: string;
  signed: boolean;
  contractReady?: boolean;
  onOpenContract?: () => void;
  onOpenPv: () => void;
  onOpenBlank: () => void;
  t: (ro: string, en: string) => string;
}


export default function HandoverPvCard({ rentalId, startDate, signed, contractReady = true, onOpenContract, onOpenPv, onOpenBlank, t }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  if (!signed && !contractReady) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="h-9 w-9 rounded-xl bg-muted text-muted-foreground grid place-items-center shrink-0"><Lock className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-sm">{t("Proces-verbal de predare", "Handover report")}</h3>
            <p className="text-xs text-muted-foreground">{t("Semnați întâi contractul de închiriere. Procesul-verbal de predare se deblochează după semnarea contractului de ambele părți și sosirea zilei predării.", "Sign the rental contract first. The handover report unlocks once both parties sign the contract and handover day arrives.")}</p>
          </div>
          {onOpenContract && (
            <Button size="sm" variant="outline" onClick={onOpenContract} className="w-full sm:w-auto">
              <FileSignature className="h-4 w-4 mr-1" />{t("Vezi contractul", "View contract")}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const locked = isAfter(startOfDay(new Date(startDate)), startOfDay(new Date()));
  const badge = signed
    ? { l: t("Semnat", "Signed"), c: "bg-primary/15 text-primary" }
    : locked
      ? { l: t(`Disponibil pe ${format(new Date(startDate), "dd.MM.yyyy")}`, `Available on ${format(new Date(startDate), "dd.MM.yyyy")}`), c: "bg-muted text-muted-foreground" }
      : { l: t("Disponibil acum", "Available now"), c: "bg-primary/15 text-primary" };
  const Icon = signed ? FileCheck : locked ? Lock : FileSignature;

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
      {!signed && (
        <div role="alert" className="mb-3 flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>
            <strong>{t("Important pentru siguranța ta:", "Important for your safety:")}</strong>{" "}
            {t(
              "Nu predați și nu preluați bunul fizic până când ambele părți nu au semnat procesul-verbal în platformă. Orice daună produsă înainte de înregistrarea PV-ului nu este acoperită de protecția Rentli.",
              "Do not hand over or take the item until both parties have signed the report in the platform. Any damage before the report is recorded is not covered by the guarantee or Rentli protection."
            )}
          </p>
        </div>
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
