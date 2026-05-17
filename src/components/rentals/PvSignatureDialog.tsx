import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eraser, FileSignature, Camera, X, ChevronLeft, ChevronRight, ImagePlus, Lock, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getPvDocument,
  addPvPhoto,
  removePvPhoto,
  uploadPvPhoto,
  uploadPvPdf,
  savePvSignatureAndPdf,
  getPvFileSignedUrl,
  updatePvPdfPath,
  type PvDocument,
} from "@/features/rentals/rentalDetailPageApi";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: RentalFullDetail;
  phase: "handover" | "return";
  role: "owner" | "renter";
  onSigned?: () => void;
}

const MIN_PHOTOS = 2;

export default function PvSignatureDialog({ open, onOpenChange, rental, phase, role, onSigned }: Props) {
  const { user } = useAuth();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [pv, setPv] = useState<PvDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getPvDocument(rental.id, phase)
      .then((d) => setPv(d))
      .catch((e) => toast.error(e?.message || "Eroare la încărcare"))
      .finally(() => setLoading(false));
  }, [open, rental.id, phase]);

  const photosMeta = pv?.photos_meta || [];
  const photos = photosMeta.map((m) => m.path);
  const otherSigned = role === "owner" ? !!pv?.renter_signed_at : !!pv?.owner_signed_at;
  const mySigned = role === "owner" ? !!pv?.owner_signed_at : !!pv?.renter_signed_at;
  // Sequential flow: handover → owner uploads+signs first, renter only signs to approve.
  //                  return   → renter uploads+signs first, owner only signs to approve.
  const uploaderRole: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const isUploader = role === uploaderRole;
  const isFirstSigner = isUploader;
  const isMyTurn = !mySigned && (isFirstSigner || otherSigned);
  const isLockedWaiting = !mySigned && !isMyTurn;
  const canUpload = isUploader && !mySigned;
  const canSign = isMyTurn && (isUploader ? photos.length >= MIN_PHOTOS : photos.length > 0);
  const waitingLabel = phase === "handover"
    ? "Asteapta proprietarul sa adauge fotografiile si sa semneze PV-ul de Predare. Apoi vei putea verifica si semna pentru a aproba."
    : "Asteapta chiriasul sa initieze returnarea, sa adauge fotografiile si sa semneze PV-ul. Apoi vei putea verifica si semna pentru a aproba.";
  const galleryTitle = uploaderRole === "owner" ? "Fotografii (adaugate de Proprietar)" : "Fotografii (adaugate de Chirias)";
  const approverHint = !isUploader
    ? (phase === "handover"
        ? "Verifica fotografiile facute de proprietar. Semnand confirmi ca esti de acord cu starea documentata a produsului."
        : "Verifica fotografiile facute de chirias. Semnand confirmi ca esti de acord cu starea in care a fost returnat produsul.")
    : null;

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        const path = await uploadPvPhoto(f, rental.id, phase);
        await addPvPhoto({ rentalId: rental.id, phase, role, path });
      }
      const refreshed = await getPvDocument(rental.id, phase);
      setPv(refreshed);
      toast.success("Fotografii încărcate");
    } catch (err: any) {
      toast.error(err?.message || "Eroare la încărcare fotografii");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemovePhoto(path: string) {
    try {
      await removePvPhoto({ rentalId: rental.id, phase, path });
      const refreshed = await getPvDocument(rental.id, phase);
      setPv(refreshed);
    } catch (err: any) {
      toast.error(err?.message || "Eroare la ștergere");
    }
  }

  // TODO: inlocuit cu date reale din KYC odata ce avem CI uploadata si validata.
  // Pana atunci generam date fictive deterministice pe baza user id-ului.
  function fakeIdentity(seed: string | null | undefined) {
    const s = (seed || "00000000").replace(/[^a-f0-9]/gi, "");
    const h = (offset: number, len: number, mod: number) => {
      let n = 0;
      for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i) + offset) >>> 0;
      return String(n % mod).padStart(len, "0");
    };
    const cnp = `1${h(1, 2, 100)}${h(2, 2, 12).padStart(2, "0")}${h(3, 2, 28).padStart(2, "0")}${h(4, 6, 1000000)}`;
    const seriiCI = ["RR", "RX", "RT", "RK", "RD", "RZ"];
    const serie = seriiCI[parseInt(h(5, 1, 6), 10) || 0];
    const nr = h(6, 6, 1000000);
    const strazi = ["Florilor", "Mihai Eminescu", "Aviatorilor", "Stefan cel Mare", "Unirii", "Victoriei"];
    const strada = strazi[parseInt(h(7, 1, 6), 10) || 0];
    const nrCasa = parseInt(h(8, 2, 99), 10) || 1;
    const sector = (parseInt(h(9, 1, 6), 10) || 1);
    const adresa = `Str. ${strada} nr. ${nrCasa}, Bucuresti, Sector ${sector}`;
    return { cnp, serie, nr, adresa };
  }

  // jsPDF Helvetica nu suporta diacriticele romanesti — le inlocuim cu echivalente ASCII
  function noDia(s: string | null | undefined): string {
    if (!s) return "-";
    return s
      .replace(/[ăâ]/g, "a").replace(/[ĂÂ]/g, "A")
      .replace(/î/g, "i").replace(/Î/g, "I")
      .replace(/[șş]/g, "s").replace(/[ȘŞ]/g, "S")
      .replace(/[țţ]/g, "t").replace(/[ȚŢ]/g, "T");
  }

  async function generatePdf(updatedPv: PvDocument): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const MARGIN = 50;
    const CONTENT_W = W - MARGIN * 2;
    let y = 40;

    const ensureSpace = (needed: number) => {
      if (y + needed > H - 40) {
        doc.addPage();
        y = 50;
      }
    };
    const writeParagraph = (text: string, opts: { size?: number; bold?: boolean; align?: "left" | "center" | "justify"; lh?: number } = {}) => {
      const size = opts.size ?? 10;
      const lh = opts.lh ?? 13;
      doc.setFontSize(size);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(noDia(text), CONTENT_W) as string[];
      ensureSpace(lines.length * lh);
      if (opts.align === "center") {
        doc.text(lines, W / 2, y, { align: "center" });
      } else {
        doc.text(lines, MARGIN, y, { align: opts.align === "justify" ? "justify" : "left", maxWidth: CONTENT_W });
      }
      y += lines.length * lh;
    };

    // ===== Antet companie =====
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Rentli Platform SRL", W / 2, y, { align: "center" }); y += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(noDia("Str. Exemplu nr. 1, Bucuresti"), W / 2, y, { align: "center" }); y += 11;
    doc.text("CUI: RO12345678 | J40/1234/2024", W / 2, y, { align: "center" }); y += 11;
    doc.text("Tel: +40 740 000 000 | Email: contact@rentli.ro", W / 2, y, { align: "center" }); y += 14;
    doc.setDrawColor(200); doc.line(MARGIN, y, W - MARGIN, y); y += 22;

    // ===== Titlu =====
    const phaseLabel = phase === "handover" ? "PROCES-VERBAL DE PREDARE-PRIMIRE" : "PROCES-VERBAL DE RETURNARE";
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(phaseLabel, W / 2, y, { align: "center" }); y += 22;

    // ===== Date parti =====
    const today = format(new Date(), "dd MMMM yyyy");
    const ownerId = fakeIdentity(rental.owner_id);
    const renterId = fakeIdentity(rental.renter_id);
    const ownerName = rental.owner_name || "Proprietar";
    const renterName = rental.renter_name || "Chirias";
    const ownerPhone = rental.owner_phone || "0740 000 000";
    const renterPhone = rental.renter_phone || "0740 000 000";
    const ownerEmail = rental.owner_email || "owner@rentli.ro";
    const renterEmail = rental.renter_email || "renter@rentli.ro";

    const intro =
      `Incheiat astazi, ${today}, intre domnul/doamna ${ownerName}, in calitate de Predator (proprietar), ` +
      `identificat cu CNP ${ownerId.cnp}, CI seria ${ownerId.serie} nr. ${ownerId.nr}, domiciliat in ${ownerId.adresa}, ` +
      `telefon ${ownerPhone}, email ${ownerEmail}, si domnul/doamna ${renterName}, in calitate de Primitor (chirias/utilizator), ` +
      `identificat cu CNP ${renterId.cnp}, CI seria ${renterId.serie} nr. ${renterId.nr}, domiciliat in ${renterId.adresa}, ` +
      `telefon ${renterPhone}, email ${renterEmail}.`;
    writeParagraph(intro, { align: "justify" });
    y += 8;

    // ===== Obiectul =====
    const cat = rental.product_category || "-";
    const obj =
      `Prin prezentul proces-verbal, Predatorul preda, iar Primitorul primeste spre utilizare temporara, ` +
      `prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: ${rental.product_title || "-"}, ` +
      `din categoria ${cat}, pentru o perioada de ${rental.rental_days} zile, cu costul total de ${rental.subtotal} lei ` +
      `(${rental.daily_price} lei/zi) si o garantie de ${rental.product_deposit_value ?? 0} lei.`;
    writeParagraph(obj, { align: "justify" });
    y += 8;

    // ===== Accesorii =====
    const items = rental.product_included_items || [];
    if (items.length > 0) {
      const accText = phase === "handover"
        ? `Bunul este insotit de urmatoarele accesorii: ${items.join(", ")}. La momentul predarii au fost realizate fotografii pentru confirmarea starii acestuia: DA.`
        : `Bunul este insotit de urmatoarele accesorii: ${items.join(", ")}. La momentul returnarii au fost realizate fotografii pentru confirmarea starii acestuia: DA.`;
      writeParagraph(accText, { align: "justify" });
      y += 8;
    }

    // ===== Perioada =====
    const perText =
      `Perioada de utilizare convenita intre parti este de la data ${format(new Date(rental.start_date), "dd.MM.yyyy")} ` +
      `pana la data ${format(new Date(rental.end_date), "dd.MM.yyyy")}.`;
    writeParagraph(perText, { align: "justify" });
    y += 8;

    // ===== Responsabilitate =====
    const respText = phase === "handover"
      ? "Primitorul declara ca a verificat bunul si il accepta in starea mentionata, obligandu-se sa il utilizeze conform destinatiei sale, sa il pastreze in bune conditii si sa il returneze la termenul stabilit, in aceeasi stare, cu exceptia uzurii normale. Primitorul isi asuma raspunderea pentru orice deteriorare, pierdere sau furt survenite pe perioada utilizarii si se obliga sa notifice imediat Predatorul in cazul aparitiei unor defecte sau incidente."
      : "Primitorul restituie bunul catre Predator, iar Predatorul confirma primirea acestuia in starea documentata prin fotografiile anexate. Eventualele daune constatate la momentul returnarii vor fi reglementate prin intermediul platformei Rentli, conform termenilor si conditiilor agreate.";
    writeParagraph(respText, { align: "justify" });
    y += 8;

    // ===== Clauza finala =====
    writeParagraph(
      "Eventualele neintelegeri vor fi solutionate conform termenilor si conditiilor platformei Rentli. Prezentul proces-verbal a fost incheiat in doua exemplare, cate unul pentru fiecare parte, avand aceeasi valoare juridica.",
      { align: "justify" },
    );
    y += 14;

    // ===== Fotografii =====
    ensureSpace(20);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(noDia(phase === "handover" ? "Fotografii la predare:" : "Fotografii la returnare:"), MARGIN, y);
    y += 14;
    doc.setFont("helvetica", "normal");

    // Embed photos in a 2-column grid
    const meta = (updatedPv as any).photos_meta as Array<{ path: string; role: "owner" | "renter"; uploaded_at: string }> | undefined;
    const photoList = (meta && meta.length > 0)
      ? meta
      : (updatedPv.photos || []).map((p) => ({ path: p, role: "owner" as const, uploaded_at: "" }));

    if (photoList.length > 0) {
      const loaded = await Promise.all(
        photoList.map(async (m) => {
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
              img.onerror = () => reject(new Error("img load"));
              img.src = dataUrl;
            });
            return { ...m, dataUrl, dims };
          } catch {
            return null;
          }
        })
      );

      const items = loaded.filter(Boolean) as Array<{ path: string; role: "owner" | "renter"; uploaded_at: string; dataUrl: string; dims: { w: number; h: number } }>;
      if (items.length > 0) {
        const colW = (W - 100 - 20) / 2; // 50 margin each side, 20 gutter
        const maxImgH = 160;
        for (let i = 0; i < items.length; i += 2) {
          // Check page space for a row (image + label)
          if (y + maxImgH + 18 > H - 40) {
            doc.addPage();
            y = 50;
          }
          let rowH = 0;
          for (let c = 0; c < 2 && i + c < items.length; c++) {
            const it = items[i + c];
            const ratio = it.dims.w / it.dims.h || 1;
            let w = colW;
            let h = w / ratio;
            if (h > maxImgH) { h = maxImgH; w = h * ratio; }
            const x = 50 + c * (colW + 20);
            try {
              doc.addImage(it.dataUrl, "JPEG", x, y, w, h);
            } catch {
              try { doc.addImage(it.dataUrl, "PNG", x, y, w, h); } catch { /* skip */ }
            }
            doc.setFontSize(8); doc.setFont("helvetica", "normal");
            const label = `${it.role === "owner" ? "Predator (proprietar)" : "Primitor (chirias)"}${it.uploaded_at ? " - " + format(new Date(it.uploaded_at), "dd.MM.yyyy HH:mm") : ""}`;
            doc.text(label, x, y + h + 10);
            rowH = Math.max(rowH, h);
          }
          y += rowH + 22;
        }
        y += 6;
        doc.setFontSize(10);
      }
    }

    // ===== Semnaturi =====
    if (y + 130 > H - 40) { doc.addPage(); y = 50; }
    const colW = (W - 100) / 2;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(noDia("Predator (proprietar)"), MARGIN, y);
    doc.text(noDia("Primitor (chirias)"), MARGIN + colW, y);
    y += 8;
    const sigY = y;
    function tryDrawSig(dataUrl: string | null, x: number) {
      if (!dataUrl) return;
      try { doc.addImage(dataUrl, "PNG", x, sigY, colW - 10, 60); } catch (e) { /* noop */ }
    }
    tryDrawSig(updatedPv.owner_signature_data, MARGIN);
    tryDrawSig(updatedPv.renter_signature_data, MARGIN + colW);
    y += 64;
    doc.setDrawColor(120);
    doc.line(MARGIN, y, MARGIN + colW - 10, y);
    doc.line(MARGIN + colW, y, MARGIN + colW * 2 - 10, y);
    y += 12;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(noDia(ownerName), MARGIN, y);
    doc.text(noDia(renterName), MARGIN + colW, y);
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

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Te rugam sa semnezi in caseta");
      return;
    }
    const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    setSigning(true);
    try {
      // Save signature first
      await savePvSignatureAndPdf({ rentalId: rental.id, phase, role, signatureDataUrl: dataUrl });
      const refreshed = await getPvDocument(rental.id, phase);
      if (!refreshed) throw new Error("PV not found");

      // If both signed -> generate PDF
      if (refreshed.owner_signature_data && refreshed.renter_signature_data) {
        try {
          const blob = await generatePdf(refreshed);
          const path = await uploadPvPdf(blob, rental.id, phase);
          await updatePvPdfPath(rental.id, phase, path);
          const afterPdf = await getPvDocument(rental.id, phase);
          if (afterPdf) setPv(afterPdf);
        } catch (pdfErr: any) {
          console.error("PV PDF generation failed:", pdfErr);
          toast.error("PDF: " + (pdfErr?.message || "eroare la generare"));
        }
      } else {
        setPv(refreshed);
      }

      // Notify the other party (in-app + email + SMS via existing function)
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
      } catch (e) { /* non-blocking */ }

      toast.success("Semnatura inregistrata");
      onSigned?.();
      // Keep dialog open if PDF still missing so user sees the regenerate button.
      const finalPv = await getPvDocument(rental.id, phase);
      if (finalPv) setPv(finalPv);
      if (finalPv?.pdf_path) onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la semnare");
    } finally {
      setSigning(false);
    }
  }

  async function handleViewPdf() {
    if (!pv?.pdf_path) return;
    try {
      const url = await getPvFileSignedUrl(pv.pdf_path);
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Nu s-a putut deschide PDF");
    }
  }

  async function handleRegeneratePdf() {
    if (!pv) return;
    setRegenerating(true);
    try {
      const blob = await generatePdf(pv);
      const path = await uploadPvPdf(blob, rental.id, phase);
      await updatePvPdfPath(rental.id, phase, path);
      const refreshed = await getPvDocument(rental.id, phase);
      if (refreshed) setPv(refreshed);
      toast.success("PDF regenerat");
    } catch (e: any) {
      console.error("PV PDF regenerate failed:", e);
      toast.error("PDF: " + (e?.message || "eroare la generare"));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase === "handover" ? "Proces Verbal — Predare" : "Proces Verbal — Returnare"}</DialogTitle>
          <DialogDescription>
            Incarca minim {MIN_PHOTOS} fotografii ale produsului, apoi semneaza. PDF-ul este generat dupa ce ambele parti au semnat.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            {/* Add photos CTA */}
            <section className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Fotografii ({photos.length})</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isUploader
                    ? `Min. ${MIN_PHOTOS} foto. Recomandat: vedere de ansamblu, accesorii, eventuale defecte.`
                    : `Doar ${uploaderRole === "owner" ? "proprietarul" : "chiriasul"} poate adauga fotografii pentru acest PV. Tu doar verifici si semnezi.`}
                </p>
              </div>
              {canUpload && (
                <label className={uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} disabled={uploading} />
                  <span className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-[#F98715] transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Adauga fotografii
                  </span>
                </label>
              )}
            </section>

            {isLockedWaiting && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Randul nu este al tau inca</p>
                  <p className="text-xs">{waitingLabel}</p>
                </div>
              </section>
            )}

            {/* Unified gallery (uploader contributes; the other party only views) */}
            <PhotoGallery
              title={galleryTitle}
              accent={uploaderRole === "owner" ? "bg-sky-50 border-sky-200" : "bg-amber-50 border-amber-200"}
              chip={uploaderRole === "owner" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}
              photosMeta={photosMeta}
              myRole={role}
              role={uploaderRole}
              canDelete={isUploader && !mySigned}
              onRemove={handleRemovePhoto}
              onOpen={(path) => setLightbox(photos.indexOf(path))}
            />

            {approverHint && (
              <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg p-3">
                {approverHint}
              </p>
            )}

            {/* Prominent PDF button */}
            {pv?.pdf_path && (
              <button
                type="button"
                onClick={handleViewPdf}
                className="w-full flex items-center justify-between gap-3 rounded-xl bg-[#F59E0B] hover:bg-[#F98715] transition-colors text-white p-4 shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="text-left">
                    <span className="block font-semibold text-sm">Vezi PV semnat (PDF)</span>
                    <span className="block text-xs opacity-90">Document semnat de ambele părți, cu fotografii</span>
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 opacity-90" />
              </button>
            )}

            {/* Regenerate PDF (also creates it if missing). Available once both parties signed. */}
            {pv?.owner_signed_at && pv?.renter_signed_at && (
              <button
                type="button"
                onClick={handleRegeneratePdf}
                disabled={regenerating}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors p-3 text-sm disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                    {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <span className="text-left">
                    <span className="block font-semibold">{pv?.pdf_path ? "Regenereaza PDF" : "Genereaza PDF"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {pv?.pdf_path ? "Recreeaza documentul cu noul template" : "PDF-ul nu a fost generat — apasa pentru a-l crea"}
                    </span>
                  </span>
                </span>
              </button>
            )}

            {/* Status */}
            <section className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
              <div>Proprietar: {pv?.owner_signed_at ? `semnat ${format(new Date(pv.owner_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
              <div>Chirias: {pv?.renter_signed_at ? `semnat ${format(new Date(pv.renter_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
            </section>

            {/* Signature pad */}
            {!mySigned && isMyTurn && (
              <section>
                <h4 className="font-semibold text-sm mb-2">Semnatura ta ({role === "owner" ? "Proprietar" : "Chirias"})</h4>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <SignatureCanvas
                    ref={sigRef}
                    canvasProps={{ className: "w-full h-40 touch-none", style: { width: "100%", height: 160 } }}
                    backgroundColor="#fff"
                    penColor="#111"
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <Button type="button" variant="ghost" size="sm" onClick={() => sigRef.current?.clear()}>
                    <Eraser className="h-4 w-4 mr-1" />Sterge
                  </Button>
                  {!canSign && isUploader && photos.length < MIN_PHOTOS && (
                    <span className="text-xs text-muted-foreground self-center">Adauga {MIN_PHOTOS - photos.length} fotografii</span>
                  )}
                  {!canSign && !isUploader && photos.length === 0 && (
                    <span className="text-xs text-muted-foreground self-center">Asteapta fotografii</span>
                  )}
                </div>
              </section>
            )}

            {mySigned && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Ai semnat acest proces verbal. {!otherSigned && "Asteptam semnatura celuilalt participant."}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Inchide</Button>
          {!mySigned && isMyTurn && (
            <Button onClick={handleSign} disabled={!canSign || signing}>
              {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
              Semneaza
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {lightbox !== null && photos[lightbox] && (
        <Lightbox
          paths={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </Dialog>
  );
}

function PvPhoto({ path, onClick }: { path: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getPvFileSignedUrl(path).then(setUrl).catch(() => setUrl(null));
  }, [path]);
  return (
    <button type="button" onClick={onClick} className="aspect-square rounded-md overflow-hidden bg-muted block w-full">
      {url ? <img src={url} alt="PV" className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-muted" />}
    </button>
  );
}

function PhotoGallery({
  title, accent, chip, photosMeta, role, myRole, canDelete, onRemove, onOpen,
}: {
  title: string;
  accent: string;
  chip: string;
  photosMeta: { path: string; role: "owner" | "renter"; uploaded_at: string }[];
  role: "owner" | "renter";
  myRole: "owner" | "renter";
  canDelete: boolean;
  onRemove: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  const isMine = role === myRole;
  return (
    <section className={`rounded-xl border ${accent} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          {title}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${chip}`}>{photosMeta.length}</span>
          {isMine && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground">Tu</span>}
        </h4>
      </div>
      {photosMeta.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nicio fotografie inca.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photosMeta.map((m) => (
            <div key={m.path} className="relative group">
              <PvPhoto path={m.path} onClick={() => onOpen(m.path)} />
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(m.path); }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Sterge"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Lightbox({ paths, index, onClose, onIndex }: { paths: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    getPvFileSignedUrl(paths[index]).then(setUrl).catch(() => setUrl(null));
  }, [paths, index]);
  const prev = () => onIndex((index - 1 + paths.length) % paths.length);
  const next = () => onIndex((index + 1) % paths.length);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paths.length]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
      <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white/80 hover:text-white"><ChevronLeft className="h-8 w-8" /></button>
      <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white/80 hover:text-white"><ChevronRight className="h-8 w-8" /></button>
      <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {url ? <img src={url} alt="PV" className="max-h-[90vh] max-w-[90vw] object-contain" /> : <Loader2 className="h-8 w-8 animate-spin text-white" />}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">{index + 1} / {paths.length}</div>
    </div>
  );
}