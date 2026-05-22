import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eraser, FileSignature, Download, FileText, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getPvDocument,
  uploadPvPdf,
  savePvSignatureAndPdf,
  getPvFileSignedUrl,
  type PvDocument,
} from "@/features/rentals/rentalDetailPageApi";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import { buildPvContent, fakeIdentity, noDia, COMPANY, MIN_PV_PHOTOS } from "@/lib/pvContent";
import { generatePvDocx, downloadBlob } from "@/lib/pvDocx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: RentalFullDetail;
  phase: "handover" | "return";
  role: "owner" | "renter";
  onSigned?: () => void;
}

export default function PvSignatureDialog({ open, onOpenChange, rental, phase, role, onSigned }: Props) {
  const { user } = useAuth();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [pv, setPv] = useState<PvDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getPvDocument(rental.id, phase)
      .then(setPv)
      .catch((e) => toast.error(e?.message || "Eroare la incarcare"))
      .finally(() => setLoading(false));

    const ch = supabase
      .channel(`pv-doc-${rental.id}-${phase}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_pv_documents", filter: `rental_id=eq.${rental.id}` },
        () => { getPvDocument(rental.id, phase).then(setPv).catch(() => undefined); },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, rental.id, phase]);

  const content = buildPvContent(rental, phase);
  const ownerId = fakeIdentity(rental.owner_id);
  const renterId = fakeIdentity(rental.renter_id);

  const uploaderRole: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const isUploader = role === uploaderRole;
  const photosMeta = pv?.photos_meta || [];
  const photos = photosMeta.map((m) => m.path);
  const ownerSigned = !!pv?.owner_signed_at;
  const renterSigned = !!pv?.renter_signed_at;
  const mySigned = role === "owner" ? ownerSigned : renterSigned;
  const otherSigned = role === "owner" ? renterSigned : ownerSigned;
  const isMyTurn = !mySigned && (isUploader || otherSigned);
  const canSign = isMyTurn && photos.length >= MIN_PV_PHOTOS;
  const ctaLabel = isUploader ? "Semneaza si trimite clientului" : "Semneaza acordul";

  // ===================== PDF (jsPDF) =====================
  async function generatePdf(updatedPv: PvDocument): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const MARGIN = 50;
    const CONTENT_W = W - MARGIN * 2;
    let y = 40;

    const ensureSpace = (needed: number) => {
      if (y + needed > H - 40) { doc.addPage(); y = 50; }
    };
    const writeParagraph = (text: string, opts: { size?: number; bold?: boolean; align?: "left" | "center" | "justify"; lh?: number } = {}) => {
      const size = opts.size ?? 10;
      const lh = opts.lh ?? 13;
      doc.setFontSize(size);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(noDia(text), CONTENT_W) as string[];
      ensureSpace(lines.length * lh);
      if (opts.align === "center") doc.text(lines, W / 2, y, { align: "center" });
      else doc.text(lines, MARGIN, y, { align: opts.align === "justify" ? "justify" : "left", maxWidth: CONTENT_W });
      y += lines.length * lh;
    };

    // Header
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, W / 2, y, { align: "center" }); y += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(noDia(COMPANY.address), W / 2, y, { align: "center" }); y += 11;
    doc.text(COMPANY.fiscal, W / 2, y, { align: "center" }); y += 11;
    doc.text(COMPANY.contact, W / 2, y, { align: "center" }); y += 14;
    doc.setDrawColor(200); doc.line(MARGIN, y, W - MARGIN, y); y += 22;

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(noDia(content.title), W / 2, y, { align: "center" }); y += 22;

    writeParagraph(content.intro, { align: "justify" }); y += 8;
    writeParagraph(content.object, { align: "justify" }); y += 8;
    if (content.accessories) { writeParagraph(content.accessories, { align: "justify" }); y += 8; }
    writeParagraph(content.period, { align: "justify" }); y += 8;
    writeParagraph(content.responsibility, { align: "justify" }); y += 8;
    writeParagraph(content.finalClause, { align: "justify" }); y += 14;

    // Photos
    ensureSpace(20);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(noDia(phase === "handover" ? "Fotografii la predare:" : "Fotografii la returnare:"), MARGIN, y); y += 14;
    doc.setFont("helvetica", "normal");

    const meta = updatedPv.photos_meta || [];
    if (meta.length > 0) {
      const loaded = await Promise.all(meta.map(async (m) => {
        try {
          const url = await getPvFileSignedUrl(m.path);
          const res = await fetch(url);
          const blob = await res.blob();
          const dataUrl: string = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = () => reject(fr.error);
            fr.readAsDataURL(blob);
          });
          const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => reject(new Error("img"));
            img.src = dataUrl;
          });
          return { ...m, dataUrl, dims };
        } catch { return null; }
      }));
      const items = loaded.filter(Boolean) as Array<{ path: string; role: "owner" | "renter"; uploaded_at: string; dataUrl: string; dims: { w: number; h: number } }>;
      if (items.length > 0) {
        const colW = (W - 100 - 20) / 2;
        const maxImgH = 160;
        for (let i = 0; i < items.length; i += 2) {
          if (y + maxImgH + 18 > H - 40) { doc.addPage(); y = 50; }
          let rowH = 0;
          for (let c = 0; c < 2 && i + c < items.length; c++) {
            const it = items[i + c];
            const ratio = it.dims.w / it.dims.h || 1;
            let w = colW; let h = w / ratio;
            if (h > maxImgH) { h = maxImgH; w = h * ratio; }
            const x = 50 + c * (colW + 20);
            try { doc.addImage(it.dataUrl, "JPEG", x, y, w, h); }
            catch { try { doc.addImage(it.dataUrl, "PNG", x, y, w, h); } catch { /* skip */ } }
            doc.setFontSize(8); doc.text(`Poza ${i + c + 1}`, x, y + h + 10);
            rowH = Math.max(rowH, h);
          }
          y += rowH + 22;
        }
        y += 6;
        doc.setFontSize(10);
      }
    }

    // Signatures
    if (y + 130 > H - 40) { doc.addPage(); y = 50; }
    const colW = (W - 100) / 2;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(noDia("Predator (proprietar)"), MARGIN, y);
    doc.text(noDia("Primitor (chirias)"), MARGIN + colW, y);
    y += 8;
    const sigY = y;
    const tryDrawSig = (dataUrl: string | null, x: number) => {
      if (!dataUrl) return;
      try { doc.addImage(dataUrl, "PNG", x, sigY, colW - 10, 60); } catch { /* noop */ }
    };
    tryDrawSig(updatedPv.owner_signature_data, MARGIN);
    tryDrawSig(updatedPv.renter_signature_data, MARGIN + colW);
    y += 64;
    doc.setDrawColor(120);
    doc.line(MARGIN, y, MARGIN + colW - 10, y);
    doc.line(MARGIN + colW, y, MARGIN + colW * 2 - 10, y);
    y += 12;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(noDia(content.ownerName), MARGIN, y);
    doc.text(noDia(content.renterName), MARGIN + colW, y);
    y += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Semnat: ${updatedPv.owner_signed_at ? format(new Date(updatedPv.owner_signed_at), "dd.MM.yyyy HH:mm") : "-"}`, MARGIN, y);
    doc.text(`Semnat: ${updatedPv.renter_signed_at ? format(new Date(updatedPv.renter_signed_at), "dd.MM.yyyy HH:mm") : "-"}`, MARGIN + colW, y);
    y += 16;
    doc.setFontSize(7); doc.setTextColor(140);
    doc.text(noDia(`Cod inchiriere: ${rental.public_id || "-"} | Generat: ${format(new Date(), "dd.MM.yyyy HH:mm")}`), MARGIN, y);
    doc.setTextColor(0);

    return doc.output("blob");
  }

  // ===================== Actions =====================
  async function handleDownloadPdf() {
    if (!pv) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePdf(pv);
      downloadBlob(blob, `${content.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${rental.public_id || rental.id}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la generare PDF");
    } finally { setDownloadingPdf(false); }
  }

  async function handleDownloadDocx() {
    if (!pv) return;
    setDownloadingDocx(true);
    try {
      const blob = await generatePvDocx(rental, pv, phase);
      downloadBlob(blob, `${content.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${rental.public_id || rental.id}.docx`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Eroare la generare DOCX");
    } finally { setDownloadingDocx(false); }
  }

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) { toast.error("Te rugam sa semnezi in caseta"); return; }
    const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    setSigning(true);
    try {
      await savePvSignatureAndPdf({ rentalId: rental.id, phase, role, signatureDataUrl: dataUrl });
      const refreshed = await getPvDocument(rental.id, phase);
      if (!refreshed) throw new Error("PV not found");

      if (refreshed.owner_signature_data && refreshed.renter_signature_data) {
        try {
          const blob = await generatePdf(refreshed);
          const path = await uploadPvPdf(blob, rental.id, phase);
          await savePvSignatureAndPdf({ rentalId: rental.id, phase, role, signatureDataUrl: dataUrl, pdfPath: path });
          const afterPdf = await getPvDocument(rental.id, phase);
          if (afterPdf) setPv(afterPdf);
        } catch (pdfErr: any) {
          console.error("PV PDF gen failed:", pdfErr);
          toast.error("PDF: " + (pdfErr?.message || "eroare la generare"));
        }
      } else { setPv(refreshed); }

      try {
        const event_key = phase === "handover" ? "pv_pickup_completed_by_party" : "pv_return_completed_by_party";
        await supabase.functions.invoke("notify-rental-event", {
          body: {
            rental_id: rental.id,
            event_key,
            actor_id: user?.id,
            extra: { actorName: role === "owner" ? rental.owner_name : rental.renter_name, phase },
          },
        });
        // If BOTH parties have now signed, fire the "complete" event to notify both.
        if (refreshed.owner_signature_data && refreshed.renter_signature_data) {
          const complete_event = phase === "handover" ? "handover_confirmed" : "rental_completed";
          await supabase.functions.invoke("notify-rental-event", {
            body: { rental_id: rental.id, event_key: complete_event, actor_id: user?.id },
          });
        }
      } catch { /* non-blocking */ }

      onSigned?.();
      const finalPv = await getPvDocument(rental.id, phase);
      if (finalPv) setPv(finalPv);
      if (finalPv?.pdf_path) onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la semnare");
    } finally { setSigning(false); }
  }

  async function handleViewSignedPdf() {
    if (!pv?.pdf_path) return;
    try {
      const url = await getPvFileSignedUrl(pv.pdf_path);
      window.open(url, "_blank");
    } catch (e: any) { toast.error(e?.message || "Nu s-a putut deschide PDF"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Proces-verbal de {phase === "handover" ? "predare-primire" : "returnare"}</DialogTitle>
          <DialogDescription>
            Citeste documentul, apoi semneaza cu mouse-ul in spatiul de jos.
          </DialogDescription>
        </DialogHeader>

        {loading || !pv ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Rendered document */}
            <article className="rounded-xl border border-border bg-white text-foreground shadow-sm p-6 sm:p-10 font-serif leading-relaxed text-[13.5px]">
              {/* Company header */}
              <header className="text-center mb-4">
                <p className="font-bold text-base">{COMPANY.name}</p>
                <p className="text-xs text-muted-foreground">{COMPANY.address}</p>
                <p className="text-xs text-muted-foreground">{COMPANY.fiscal}</p>
                <p className="text-xs text-muted-foreground">{COMPANY.contact}</p>
              </header>
              <hr className="border-border my-4" />

              <h2 className="text-center font-bold text-[15px] tracking-wide my-6">{content.title}</h2>

              <DocParagraph>
                Incheiat astazi, <strong>{content.todayLabel}</strong>, intre domnul/doamna <strong>{content.ownerName}</strong>, in calitate de <strong>Predator (proprietar)</strong>, identificat cu CNP <strong>{ownerId.cnp}</strong>, CI seria <strong>{ownerId.serie}</strong> nr. <strong>{ownerId.nr}</strong>, domiciliat in <strong>{ownerId.adresa}</strong>, telefon <strong>{rental.owner_phone || "0740 000 000"}</strong>, email <strong>{rental.owner_email || "owner@rentli.ro"}</strong>, si domnul/doamna <strong>{content.renterName}</strong>, in calitate de <strong>Primitor (chirias/utilizator)</strong>, identificat cu CNP <strong>{renterId.cnp}</strong>, CI seria <strong>{renterId.serie}</strong> nr. <strong>{renterId.nr}</strong>, domiciliat in <strong>{renterId.adresa}</strong>, telefon <strong>{rental.renter_phone || "0740 000 000"}</strong>, email <strong>{rental.renter_email || "renter@rentli.ro"}</strong>.
              </DocParagraph>

              <DocParagraph>
                Prin prezentul proces-verbal, Predatorul preda, iar Primitorul primeste spre utilizare temporara, prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: <strong>{rental.product_title || "-"}</strong>, din categoria <strong>{rental.product_category || "-"}</strong>, pentru o perioada de <strong>{rental.rental_days} zile</strong>, cu costul total de <strong>{rental.subtotal} lei</strong> ({rental.daily_price} lei/zi) si o garantie de <strong>{rental.product_deposit_value ?? 0} lei</strong>.
              </DocParagraph>

              {content.accessories && <DocParagraph>{content.accessories}</DocParagraph>}

              <DocParagraph>{content.period}</DocParagraph>
              <DocParagraph>{content.responsibility}</DocParagraph>
              <p className="text-xs text-muted-foreground italic mt-6">{content.finalClause}</p>

              {/* Photos */}
              {photos.length > 0 && (
                <section className="mt-8">
                  <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    {phase === "handover" ? "Fotografii la predare" : "Fotografii la returnare"}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {photosMeta.map((m, i) => (
                      <DocPhoto key={m.path} path={m.path} label={`Poza ${i + 1}`} />
                    ))}
                  </div>
                </section>
              )}

              {/* Signatures */}
              <section className="grid grid-cols-2 gap-8 mt-10 text-center">
                <SigBox label="Predator (proprietar)" name={content.ownerName} signatureData={pv.owner_signature_data} signedAt={pv.owner_signed_at} />
                <SigBox label="Primitor (chirias)" name={content.renterName} signatureData={pv.renter_signature_data} signedAt={pv.renter_signed_at} />
              </section>
            </article>

            {/* Signature pad */}
            {isMyTurn && !mySigned && (
              <section className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-primary" />
                    Semnatura {role === "owner" ? "Predator" : "Primitor"} — semneaza aici
                  </h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => sigRef.current?.clear()}>
                    <Eraser className="h-4 w-4 mr-1" />Sterge
                  </Button>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-white overflow-hidden">
                  <SignatureCanvas
                    ref={sigRef}
                    canvasProps={{ className: "w-full h-40 touch-none", style: { width: "100%", height: 160 } }}
                    backgroundColor="#fff"
                    penColor="#111"
                  />
                </div>
                {photos.length < MIN_PV_PHOTOS && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sunt necesare {MIN_PV_PHOTOS} fotografii inainte de semnare.
                  </p>
                )}
              </section>
            )}

            {!isMyTurn && !mySigned && (
              <p className="mt-4 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                {isUploader
                  ? "Asteapta cealalta parte sa-si dea acordul."
                  : `Asteapta ${uploaderRole === "owner" ? "proprietarul" : "chiriasul"} sa semneze primul.`}
              </p>
            )}

            {mySigned && !otherSigned && (
              <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Ai semnat acest proces verbal. Asteptam semnatura celuilalt participant.
              </p>
            )}

            {ownerSigned && renterSigned && pv.pdf_path && (
              <button
                type="button"
                onClick={handleViewSignedPdf}
                className="mt-4 w-full flex items-center justify-between gap-3 rounded-xl bg-[#F59E0B] hover:bg-[#F98715] transition-colors text-white p-4 shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="text-left">
                    <span className="block font-semibold text-sm">Vezi PV semnat (PDF)</span>
                    <span className="block text-xs opacity-90">Document semnat de ambele parti, cu fotografii</span>
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 opacity-90" />
              </button>
            )}
          </>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadDocx} disabled={!pv || downloadingDocx}>
              {downloadingDocx ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!pv || downloadingPdf}>
              {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              PDF
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Inchide</Button>
            {isMyTurn && !mySigned && (
              <Button onClick={handleSign} disabled={!canSign || signing} className="bg-foreground text-background hover:bg-foreground/90">
                {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {ctaLabel}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-justify">{children}</p>;
}

function DocPhoto({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { getPvFileSignedUrl(path).then(setUrl).catch(() => setUrl(null)); }, [path]);
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-muted">
      <div className="aspect-[4/3] relative">
        {url ? <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 animate-pulse bg-muted" />}
      </div>
      <p className="text-[11px] text-muted-foreground px-2 py-1">{label}</p>
    </div>
  );
}

function SigBox({ label, name, signatureData, signedAt }: { label: string; name: string; signatureData: string | null; signedAt: string | null }) {
  return (
    <div>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-sm mt-1">{name}</p>
      <div className="mt-4 h-16 flex items-end justify-center">
        {signatureData ? (
          <img src={signatureData} alt="Semnatura" className="max-h-16 object-contain" />
        ) : (
          <span className="text-xs italic text-muted-foreground">— nesemnat —</span>
        )}
      </div>
      <hr className="border-foreground/60 mt-1" />
      <p className="text-xs text-muted-foreground mt-1">
        {signedAt ? `Semnat ${format(new Date(signedAt), "dd.MM.yyyy HH:mm")}` : "Semnatura"}
      </p>
    </div>
  );
}