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
  const ownerPhotos = photosMeta.filter((m) => m.role === "owner");
  const renterPhotos = photosMeta.filter((m) => m.role === "renter");
  const otherSigned = role === "owner" ? !!pv?.renter_signed_at : !!pv?.owner_signed_at;
  const mySigned = role === "owner" ? !!pv?.owner_signed_at : !!pv?.renter_signed_at;
  // Sequential flow: handover → owner first, then renter; return → renter first, then owner.
  const firstSigner: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const isFirstSigner = role === firstSigner;
  const isMyTurn = !mySigned && (isFirstSigner || otherSigned);
  const isLockedWaiting = !mySigned && !isMyTurn;
  const canSign = photos.length >= MIN_PHOTOS && isMyTurn;
  const waitingLabel = phase === "handover"
    ? "Asteapta proprietarul sa completeze si sa semneze PV-ul de Predare. Vei putea adauga propriile fotografii si semna imediat dupa."
    : "Asteapta chiriasul sa initieze returnarea si sa semneze PV-ul. Dupa aceea vei putea adauga fotografii si semna.";

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

  async function generatePdf(updatedPv: PvDocument): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 50;
    const phaseLabel = phase === "handover" ? "PROCES VERBAL DE PREDARE-PRIMIRE" : "PROCES VERBAL DE RETURNARE";
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(phaseLabel, W / 2, y, { align: "center" }); y += 30;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Cod inchiriere: ${rental.public_id}`, 50, y); y += 14;
    doc.text(`Data generare: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, 50, y); y += 22;

    doc.setFont("helvetica", "bold"); doc.text("Produs:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(rental.product_title || "-", 110, y); y += 14;
    doc.setFont("helvetica", "bold"); doc.text("Perioada:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(`${format(new Date(rental.start_date), "dd.MM.yyyy")} - ${format(new Date(rental.end_date), "dd.MM.yyyy")}`, 110, y); y += 14;
    doc.setFont("helvetica", "bold"); doc.text("Garantie:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(`${rental.product_deposit_value ?? 0} RON`, 110, y); y += 22;

    doc.setFont("helvetica", "bold"); doc.text("Proprietar:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(rental.owner_name || "-", 130, y); y += 14;
    doc.setFont("helvetica", "bold"); doc.text("Chirias:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(rental.renter_name || "-", 130, y); y += 22;

    doc.setFont("helvetica", "bold"); doc.text("Fotografii anexate:", 50, y); doc.setFont("helvetica", "normal");
    doc.text(`${updatedPv.photos.length} fotografii`, 170, y); y += 22;

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
            const label = `${it.role === "owner" ? "Proprietar" : "Chirias"}${it.uploaded_at ? " · " + format(new Date(it.uploaded_at), "dd.MM.yyyy HH:mm") : ""}`;
            doc.text(label, x, y + h + 10);
            rowH = Math.max(rowH, h);
          }
          y += rowH + 22;
        }
        y += 6;
        doc.setFontSize(10);
      }
    }

    // Ensure room for intro + signatures
    if (y + 180 > H - 40) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(9);
    const intro = phase === "handover"
      ? "Subsemnatii confirma predarea-primirea produsului in stare buna conform fotografiilor anexate. Chiriasul este responsabil de produs pe durata inchirierii."
      : "Subsemnatii confirma returnarea produsului. Eventualele daune sunt documentate prin fotografiile anexate si vor fi reglementate prin platforma Rentli.";
    const lines = doc.splitTextToSize(intro, W - 100);
    doc.text(lines, 50, y); y += lines.length * 12 + 30;

    doc.setFontSize(10);
    const colW = (W - 100) / 2;
    doc.setFont("helvetica", "bold");
    doc.text("Semnatura Proprietar", 50, y);
    doc.text("Semnatura Chirias", 50 + colW, y);
    y += 10;

    function tryDrawSig(dataUrl: string | null, x: number) {
      if (!dataUrl) return;
      try { doc.addImage(dataUrl, "PNG", x, y, colW - 10, 70); } catch (e) { /* noop */ }
    }
    tryDrawSig(updatedPv.owner_signature_data, 50);
    tryDrawSig(updatedPv.renter_signature_data, 50 + colW);
    y += 80;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Semnat: ${updatedPv.owner_signed_at ? format(new Date(updatedPv.owner_signed_at), "dd.MM.yyyy HH:mm") : "-"}`, 50, y);
    doc.text(`Semnat: ${updatedPv.renter_signed_at ? format(new Date(updatedPv.renter_signed_at), "dd.MM.yyyy HH:mm") : "-"}`, 50 + colW, y);

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
        const blob = await generatePdf(refreshed);
        const path = await uploadPvPdf(blob, rental.id, phase);
        await savePvSignatureAndPdf({ rentalId: rental.id, phase, role, signatureDataUrl: dataUrl, pdfPath: path });
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
      onOpenChange(false);
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
                  Min. {MIN_PHOTOS} foto. Recomandat: vedere de ansamblu, accesorii, eventuale defecte.
                </p>
              </div>
              <label className={(mySigned || !isMyTurn) ? "pointer-events-none opacity-50" : "cursor-pointer"}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} disabled={uploading || mySigned || !isMyTurn} />
                <span className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-[#F98715] transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Adauga fotografii
                </span>
              </label>
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

            {/* Owner gallery */}
            <PhotoGallery
              title="Fotografii Proprietar"
              accent="bg-sky-50 border-sky-200"
              chip="bg-sky-100 text-sky-800"
              photosMeta={ownerPhotos}
              myRole={role}
              role="owner"
              canDelete={role === "owner" && !mySigned}
              onRemove={handleRemovePhoto}
              onOpen={(path) => setLightbox(photos.indexOf(path))}
            />
            {/* Renter gallery */}
            <PhotoGallery
              title="Fotografii Chirias"
              accent="bg-amber-50 border-amber-200"
              chip="bg-amber-100 text-amber-800"
              photosMeta={renterPhotos}
              myRole={role}
              role="renter"
              canDelete={role === "renter" && !mySigned}
              onRemove={handleRemovePhoto}
              onOpen={(path) => setLightbox(photos.indexOf(path))}
            />

            {/* Status */}
            <section className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
              <div>Proprietar: {pv?.owner_signed_at ? `semnat ${format(new Date(pv.owner_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
              <div>Chirias: {pv?.renter_signed_at ? `semnat ${format(new Date(pv.renter_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
              {pv?.pdf_path && (
                <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={handleViewPdf}>Vezi PDF generat</Button>
              )}
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
                  {!canSign && photos.length < MIN_PHOTOS && (
                    <span className="text-xs text-muted-foreground self-center">Adauga {MIN_PHOTOS - photos.length} fotografii</span>
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