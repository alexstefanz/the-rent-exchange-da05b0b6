import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eraser, FileSignature, Download, FileText, ExternalLink, Send } from "lucide-react";
import { X, ZoomIn, Lock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { notifyError } from "@/lib/notify";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getPvDocument,
  uploadPvPdf,
  savePvSignatureAndPdf,
  updatePvPdfPath,
  getPvFileSignedUrl,
  type PvDocument,
} from "@/features/rentals/rentalDetailPageApi";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import { buildPvContent, buildPvRichContent, noDia, COMPANY, MIN_PV_PHOTOS, type PvRun } from "@/lib/pvContent";
import { generatePvDocx, downloadBlob } from "@/lib/pvDocx";
import rentliLogoUrl from "@/assets/rentli_logo.png";

const DISPUTE_MSG =
  "Rezervarea este in verificare la echipa Rentli (disputa deschisa). Semnarea va fi posibila dupa rezolvarea disputei.";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [signNotice, setSignNotice] = useState<string | null>(null);

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

  const uploaderRole: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const isUploader = role === uploaderRole;
  const photosMeta = pv?.photos_meta || [];
  const photos = photosMeta.map((m) => m.path);
  const ownerSigned = !!pv?.owner_signed_at;
  const renterSigned = !!pv?.renter_signed_at;
  const mySigned = role === "owner" ? ownerSigned : renterSigned;
  const otherSigned = role === "owner" ? renterSigned : ownerSigned;
  const isMyTurn = !mySigned && (isUploader || otherSigned);
  const disputeOpen = rental.dispute_status === "open";
  const canSign = isMyTurn && !disputeOpen && photos.length >= MIN_PV_PHOTOS;
  const ctaLabel = isUploader ? "Semneaza si trimite clientului" : "Semneaza acordul";

  // Keep the signature canvas pixel buffer in sync with its rendered size.
  // Without this, on mobile / high-DPI screens the drawn strokes are offset
  // from the pointer and the pad can be reported as empty.
  useEffect(() => {
    if (!open || loading || !isMyTurn || mySigned) return;
    const resize = () => {
      const canvas = sigRef.current?.getCanvas();
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;
      if (canvas.width === Math.round(w * ratio) && canvas.height === Math.round(h * ratio)) return;
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      canvas.getContext("2d")?.scale(ratio, ratio);
      sigRef.current?.clear();
    };
    const t = window.setTimeout(resize, 80);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [open, loading, isMyTurn, mySigned, pv?.id]);

  useEffect(() => {
    if (!open) { setSignError(null); setSignNotice(null); }
  }, [open]);



  // ===================== PDF (jsPDF) =====================
  async function generatePdf(updatedPv: PvDocument): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const MARGIN = 50;
    const CONTENT_W = W - MARGIN * 2;
    let y = 40;
    const rich = buildPvRichContent(rental, phase);

    const ensureSpace = (needed: number) => {
      if (y + needed > H - 40) { doc.addPage(); y = 50; }
    };
    const writeParagraph = (text: string, opts: { size?: number; bold?: boolean; italic?: boolean; align?: "left" | "center" | "justify"; lh?: number; color?: [number, number, number] } = {}) => {
      const size = opts.size ?? 10;
      const lh = opts.lh ?? 13;
      doc.setFontSize(size);
      const style = opts.bold && opts.italic ? "bolditalic" : opts.bold ? "bold" : opts.italic ? "italic" : "normal";
      doc.setFont("helvetica", style);
      if (opts.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]); else doc.setTextColor(0);
      const lines = doc.splitTextToSize(noDia(text), CONTENT_W) as string[];
      ensureSpace(lines.length * lh);
      if (opts.align === "center") doc.text(lines, W / 2, y, { align: "center" });
      else doc.text(lines, MARGIN, y, { align: opts.align === "justify" ? "justify" : "left", maxWidth: CONTENT_W });
      y += lines.length * lh;
      doc.setTextColor(0);
    };

    // Word-wrap renderer for rich (bold/regular) runs.
    const writeRichParagraph = (runs: PvRun[], opts: { size?: number; lh?: number } = {}) => {
      const size = opts.size ?? 10;
      const lh = opts.lh ?? 14;
      doc.setFontSize(size);
      // Tokenize into words while keeping bold info per token.
      type Tok = { text: string; bold: boolean };
      const tokens: Tok[] = [];
      for (const r of runs) {
        const parts = noDia(r.text).split(/(\s+)/);
        for (const p of parts) if (p.length > 0) tokens.push({ text: p, bold: !!r.bold });
      }
      const widthOf = (t: Tok) => {
        doc.setFont("helvetica", t.bold ? "bold" : "normal");
        return doc.getTextWidth(t.text);
      };
      // Greedy line wrap.
      const lines: Tok[][] = [];
      let line: Tok[] = [];
      let lineW = 0;
      for (const tok of tokens) {
        const w = widthOf(tok);
        if (line.length === 0 && /^\s+$/.test(tok.text)) continue;
        if (lineW + w > CONTENT_W && line.length > 0) {
          lines.push(line);
          line = [];
          lineW = 0;
          if (/^\s+$/.test(tok.text)) continue;
        }
        line.push(tok);
        lineW += w;
      }
      if (line.length > 0) lines.push(line);

      ensureSpace(lines.length * lh);
      for (const ln of lines) {
        let x = MARGIN;
        for (const tok of ln) {
          doc.setFont("helvetica", tok.bold ? "bold" : "normal");
          doc.text(tok.text, x, y);
          x += doc.getTextWidth(tok.text);
        }
        y += lh;
      }
    };

    // Brand logo (best-effort)
    try {
      const logoDataUrl: string = await new Promise((resolve, reject) => {
        fetch(rentliLogoUrl).then((r) => r.blob()).then((b) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(b);
        }).catch(reject);
      });
      const logoW = 90, logoH = 30;
      doc.addImage(logoDataUrl, "PNG", (W - logoW) / 2, y, logoW, logoH);
      y += logoH + 8;
    } catch { /* ignore */ }

    // Header
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text(COMPANY.name, W / 2, y, { align: "center" }); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(107, 114, 128);
    doc.text(noDia(COMPANY.address), W / 2, y, { align: "center" }); y += 11;
    doc.text(COMPANY.fiscal, W / 2, y, { align: "center" }); y += 11;
    doc.text(COMPANY.contact, W / 2, y, { align: "center" }); y += 14;
    doc.setTextColor(0);
    doc.setDrawColor(229, 231, 235); doc.line(MARGIN, y, W - MARGIN, y); y += 24;

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(noDia(rich.title), W / 2, y, { align: "center" }); y += 24;

    writeRichParagraph(rich.introRuns); y += 8;
    writeRichParagraph(rich.objectRuns); y += 8;
    if (rich.accessoriesRuns) { writeRichParagraph(rich.accessoriesRuns); y += 8; }
    writeRichParagraph(rich.periodRuns); y += 8;
    writeRichParagraph(rich.responsibilityRuns); y += 12;
    // Final clause: italic, muted
    writeParagraph(rich.finalClauseRuns.map((r) => r.text).join(""), {
      align: "justify", size: 9, italic: true, color: [107, 114, 128], lh: 12,
    });
    y += 14;

    // Photos
    ensureSpace(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(107, 114, 128);
    doc.text(noDia((phase === "handover" ? "Fotografii la predare" : "Fotografii la returnare").toUpperCase()), MARGIN, y);
    y += 14;
    doc.setTextColor(0);
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
        const maxImgH = 130;
        for (let i = 0; i < items.length; i += 2) {
          // Compute actual row height (max of the two scaled images) before deciding page break
          let plannedRowH = 0;
          const sizes: { w: number; h: number }[] = [];
          for (let c = 0; c < 2 && i + c < items.length; c++) {
            const it = items[i + c];
            const ratio = it.dims.w / it.dims.h || 1;
            let w = colW; let h = w / ratio;
            if (h > maxImgH) { h = maxImgH; w = h * ratio; }
            sizes.push({ w, h });
            plannedRowH = Math.max(plannedRowH, h);
          }
          if (y + plannedRowH + 18 > H - 40) { doc.addPage(); y = 50; }
          let rowH = 0;
          for (let c = 0; c < 2 && i + c < items.length; c++) {
            const it = items[i + c];
            const { w, h } = sizes[c];
            const x = 50 + c * (colW + 20);
            try { doc.addImage(it.dataUrl, "JPEG", x, y, w, h); }
            catch { try { doc.addImage(it.dataUrl, "PNG", x, y, w, h); } catch { /* skip */ } }
            doc.setFontSize(8); doc.setTextColor(107, 114, 128);
            doc.text(`Poza ${i + c + 1}`, x, y + h + 10);
            doc.setTextColor(0);
            rowH = Math.max(rowH, h);
          }
          y += rowH + 22;
        }
        y += 6;
        doc.setFontSize(10);
      }
    }

    // Signatures — try to fit on the same page; compact layout if space is tight
    const remaining = (H - 30) - y;
    let sigImgH = 60;
    let labelGap = 14;
    let nameGap = 10;
    let lineGap = 12;
    let stampGap = 20;
    const fullBlock = 14 + 10 + 60 + 12 + 20; // ~116
    const compactBlock = 12 + 9 + 48 + 10 + 16; // ~95
    if (remaining < fullBlock) {
      if (remaining >= compactBlock) {
        sigImgH = 48; labelGap = 12; nameGap = 9; lineGap = 10; stampGap = 16;
      } else {
        doc.addPage(); y = 50;
      }
    }
    const colW = (W - 100) / 2;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(noDia("Predator (proprietar)"), MARGIN + (colW - 10) / 2, y, { align: "center" });
    doc.text(noDia("Primitor (chirias)"), MARGIN + colW + (colW - 10) / 2, y, { align: "center" });
    y += labelGap;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(noDia(rich.ownerName), MARGIN + (colW - 10) / 2, y, { align: "center" });
    doc.text(noDia(rich.renterName), MARGIN + colW + (colW - 10) / 2, y, { align: "center" });
    y += nameGap;
    const sigY = y;
    const drawSigBox = (dataUrl: string | null, x: number) => {
      if (dataUrl) {
        try { doc.addImage(dataUrl, "PNG", x + 10, sigY, colW - 30, sigImgH); }
        catch { /* noop */ }
      } else {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(153, 153, 153);
        doc.text("— nesemnat —", x + (colW - 10) / 2, sigY + sigImgH / 2 + 4, { align: "center" });
        doc.setTextColor(0); doc.setFont("helvetica", "normal");
      }
    };
    drawSigBox(updatedPv.owner_signature_data, MARGIN);
    drawSigBox(updatedPv.renter_signature_data, MARGIN + colW);
    y += sigImgH + 4;
    doc.setDrawColor(120);
    doc.line(MARGIN, y, MARGIN + colW - 10, y);
    doc.line(MARGIN + colW, y, MARGIN + colW * 2 - 10, y);
    y += lineGap;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(119, 119, 119);
    const ownerStamp = updatedPv.owner_signed_at ? `Semnat ${format(new Date(updatedPv.owner_signed_at), "dd.MM.yyyy HH:mm")}` : "Semnatura";
    const renterStamp = updatedPv.renter_signed_at ? `Semnat ${format(new Date(updatedPv.renter_signed_at), "dd.MM.yyyy HH:mm")}` : "Semnatura";
    doc.text(ownerStamp, MARGIN + (colW - 10) / 2, y, { align: "center" });
    doc.text(renterStamp, MARGIN + colW + (colW - 10) / 2, y, { align: "center" });
    y += stampGap;
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
      notifyError(e, { fallbackTitle: "Eroare la generare PDF" });
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
      notifyError(e, { fallbackTitle: "Eroare la generare DOCX" });
    } finally { setDownloadingDocx(false); }
  }

  async function handleSign() {
    setSignError(null);
    setSignNotice(null);

    if (!canSign) {
      setSignError(
        photos.length < MIN_PV_PHOTOS
          ? `Sunt necesare cel putin ${MIN_PV_PHOTOS} fotografii inainte de semnare.`
          : "Nu este randul tau sa semnezi acest document.",
      );
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setSignError("Nu am detectat nicio semnatura. Deseneaza semnatura in caseta alba, apoi apasa din nou.");
      return;
    }

    const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    setSigning(true);
    try {
      await savePvSignatureAndPdf({ rentalId: rental.id, phase, role, signatureDataUrl: dataUrl });
      const refreshed = await getPvDocument(rental.id, phase);
      if (!refreshed) throw new Error("Documentul nu a putut fi reincarcat dupa semnare.");
      setPv(refreshed);
      setSignNotice("Semnatura ta a fost inregistrata.");
      let pdfFailed = false;

      if (refreshed.owner_signature_data && refreshed.renter_signature_data) {
        try {
          const blob = await generatePdf(refreshed);
          const path = await uploadPvPdf(blob, rental.id, phase);
          // Only the pdf_path is written here — resending the signature fields
          // would be rejected as an attempt to modify a captured signature.
          await updatePvPdfPath(rental.id, phase, path);
          const afterPdf = await getPvDocument(rental.id, phase);
          if (afterPdf) setPv(afterPdf);
        } catch (pdfErr: any) {
          console.error("PV PDF gen failed:", pdfErr);
          pdfFailed = true;
          setSignNotice(null);
          setSignError(
            `Semnatura a fost salvata, dar documentul PDF nu a putut fi finalizat: ${pdfErr?.message || "eroare necunoscuta"}`,
          );
        }
      }

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
        // Note: handover_confirmed / rental_completed are fired by the dedicated
        // RPC flows (confirm_handover_received / confirm_rental_return) to avoid
        // duplicate emails when the renter performs the explicit confirmation.
      } catch { /* non-blocking */ }

      onSigned?.();
      const bothDone = !!(refreshed.owner_signed_at && refreshed.renter_signed_at);
      toast.success(bothDone ? "Procesul-verbal a fost semnat de ambele parti." : "Semnatura ta a fost inregistrata.");
      onOpenChange(false);
    } catch (e: any) {
      console.error("PV sign failed:", e);
      const m = String(e?.message || "");
      setSignError(
        m.includes("DISPUTE_OPEN")
          ? DISPUTE_MSG
          : m || "Semnatura nu a putut fi salvata. Incearca din nou.",
      );
    } finally { setSigning(false); }
  }

  async function handleViewSignedPdf() {
    if (!pv) return;
    // Same document as the PDF/DOCX downloads (single source of truth).
    const win = window.open("", "_blank");
    try {
      const blob = await generatePdf(pv);
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.open(url, "_blank");
    } catch (e: any) {
      win?.close();
      notifyError(e, { fallbackTitle: "Nu s-a putut deschide PDF" });
    }
  }

  return (
    <>
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
                Incheiat astazi, <strong>{content.todayLabel}</strong>, intre domnul/doamna <strong>{content.ownerName}</strong>, in calitate de <strong>Predator (proprietar)</strong>, telefon <strong>{rental.owner_phone || "0740 000 000"}</strong>, email <strong>{rental.owner_email || "owner@rentli.ro"}</strong>, si domnul/doamna <strong>{content.renterName}</strong>, in calitate de <strong>Primitor (chirias/utilizator)</strong>, telefon <strong>{rental.renter_phone || "0740 000 000"}</strong>, email <strong>{rental.renter_email || "renter@rentli.ro"}</strong>.
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
                      <DocPhoto key={m.path} path={m.path} label={`Poza ${i + 1}`} onClick={() => setLightboxIndex(i)} />
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

            {disputeOpen && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {DISPUTE_MSG}
              </div>
            )}

            {/* Signature pad */}
            {isMyTurn && !mySigned && !disputeOpen && (
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
                <p className="mb-2 rounded-lg border-l-2 border-primary bg-primary/10 px-3 py-2 text-xs">
                  Prin semnarea prezentului PV, confirmați că ați inspectat bunul și ați verificat starea fizică a acestuia chiar în momentul {phase === "return" ? "returnării" : "predării"}.
                </p>
                <div
                  className="rounded-lg border border-dashed border-border bg-white overflow-hidden touch-none"
                  style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  onPointerDown={() => { setSignError(null); }}
                >
                  <SignatureCanvas
                    ref={sigRef}
                    canvasProps={{
                      className: "w-full h-40 touch-none block",
                      style: { width: "100%", height: 160, touchAction: "none" },
                    }}
                    backgroundColor="#fff"
                    penColor="#111"
                    minWidth={0.8}
                    maxWidth={2.6}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Poti semna cu degetul pe telefon sau cu mouse-ul pe calculator.
                </p>
                {photos.length < MIN_PV_PHOTOS && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sunt necesare {MIN_PV_PHOTOS} fotografii inainte de semnare.
                  </p>
                )}
                {signError && (
                  <p className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    {signError}
                  </p>
                )}
                {signNotice && !signError && (
                  <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    {signNotice}
                  </p>
                )}
              </section>
            )}

            {signError && (!isMyTurn || mySigned) && (
              <p className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {signError}
              </p>
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

            {ownerSigned && renterSigned && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                Document finalizat si sigilat · Format securizat needitabil (PDF). Semnaturile si fotografiile nu mai pot fi modificate.
              </p>
            )}

            {ownerSigned && renterSigned && (
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
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!pv || downloadingPdf}>
              {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Descarca PDF
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
    {lightboxIndex !== null && photosMeta[lightboxIndex] && (
      <PvLightbox
        photos={photosMeta}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndex={setLightboxIndex}
      />
    )}
    </>
  );
}

function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-justify">{children}</p>;
}

function PvLightbox({ photos, index, onClose, onIndex }: { photos: { path: string }[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    getPvFileSignedUrl(photos[index].path).then(setUrl).catch(() => setUrl(null));
  }, [photos, index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndex]);
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm">Poza {index + 1} / {photos.length}</span>
        <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        {!url ? (
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        ) : (
          <img src={url} alt={`Poza ${index + 1}`} className="max-h-full max-w-full object-contain" />
        )}
        {index > 0 && (
          <button
            onClick={() => onIndex(index - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center"
            aria-label="prev"
          >
            ‹
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={() => onIndex(index + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center"
            aria-label="next"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}

function DocPhoto({ path, label, onClick }: { path: string; label: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { getPvFileSignedUrl(path).then(setUrl).catch(() => setUrl(null)); }, [path]);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-lg overflow-hidden border border-border bg-muted text-left cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="aspect-[4/3] relative">
        {url ? <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="absolute inset-0 animate-pulse bg-muted" />}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="h-6 w-6 text-white drop-shadow" />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground px-2 py-1">{label}</p>
    </button>
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