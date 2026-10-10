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
    return null;
    // eslint-disable-next-line no-unreachable
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

  // When the report is available, the photo + signing flow below takes its place.
  if (!signed && !locked) return null;

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
      {!signed && locked && (
        <div className="text-center py-3">
          <span className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Lock className="h-5 w-5" /></span>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">{t("Proces-verbal de predare", "Handover report")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("Se deblochează pe", "Unlocks on")}</p>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1 capitalize">
            {new Date(String(startDate).slice(0, 10) + "T00:00:00").toLocaleDateString(t("ro-RO", "en-GB"), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{t("Până atunci, stabiliți ora și locul întâlnirii. În ziua predării veți fotografia bunul și veți semna PV-ul aici.", "Until then, agree on time and place. On handover day you'll photograph the item and sign the report here.")}</p>
        </div>
      )}
      {!signed && (
        <div role="alert" className="mt-3 flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>
            <strong>{t("Important pentru siguranța ta:", "Important for your safety:")}</strong>{" "}
            {t(
              "Nu predați și nu preluați bunul fizic fără proces-verbal semnat de ambele părți — digital în platformă sau, dacă apar probleme tehnice, pe hârtie în 2 exemplare. În cazul procedurii pe hârtie, poza PV-ului semnat se încarcă în platformă în maximum 24h.",
              "Do not hand over or take the item without a report signed by both parties — digitally in the platform or, if technical issues occur, on paper in 2 copies. For the paper procedure, upload a photo of the signed report within 24h."
            )}
          </p>
        </div>
      )}
      {(signed || !locked) && (
      <div className="flex items-center gap-3 flex-wrap mt-3">
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-sm">{t("Proces-verbal de predare", "Handover report")}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.c}`}>{badge.l}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {signed ? t("Semnat de ambele părți — predarea e confirmată.", "Signed by both parties — handover confirmed.")
              : t("Disponibil acum · Fotografiați bunul mai jos, apoi semnați PV-ul.", "Available now · Photograph the item below, then sign.")}
          </p>
        </div>
        {signed && (
          <Button size="sm" onClick={onOpenPv} className="w-full sm:w-auto">
            <FileSignature className="h-4 w-4 mr-1" />{t("Vezi anexa", "View annex")}
          </Button>
        )}
      </div>
      )}
    </section>
  );
}
