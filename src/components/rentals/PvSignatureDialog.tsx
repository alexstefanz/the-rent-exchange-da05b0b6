import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eraser, FileSignature, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPvDocument,
  upsertPvPhotos,
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

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getPvDocument(rental.id, phase)
      .then((d) => setPv(d))
      .catch((e) => toast.error(e?.message || "Eroare la încărcare"))
      .finally(() => setLoading(false));
  }, [open, rental.id, phase]);

  const photos = pv?.photos || [];
  const otherSigned = role === "owner" ? !!pv?.renter_signed_at : !!pv?.owner_signed_at;
  const mySigned = role === "owner" ? !!pv?.owner_signed_at : !!pv?.renter_signed_at;
  const canSign = photos.length >= MIN_PHOTOS && !mySigned;

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const f of files) {
        const path = await uploadPvPhoto(f, rental.id, phase);
        newPaths.push(path);
      }
      const merged = [...photos, ...newPaths];
      await upsertPvPhotos(rental.id, phase, merged);
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

  async function generatePdf(updatedPv: PvDocument): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
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
            {/* Photos */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Fotografii ({photos.length})</h4>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} disabled={uploading || mySigned} />
                  <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    Adauga fotografii
                  </span>
                </label>
              </div>
              {photos.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 p-3">Nicio fotografie incarcata. Necesar minim {MIN_PHOTOS}.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((p) => <PvPhoto key={p} path={p} />)}
                </div>
              )}
            </section>

            {/* Status */}
            <section className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
              <div>Proprietar: {pv?.owner_signed_at ? `semnat ${format(new Date(pv.owner_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
              <div>Chirias: {pv?.renter_signed_at ? `semnat ${format(new Date(pv.renter_signed_at), "dd.MM.yyyy HH:mm")}` : "in asteptare"}</div>
              {pv?.pdf_path && (
                <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={handleViewPdf}>Vezi PDF generat</Button>
              )}
            </section>

            {/* Signature pad */}
            {!mySigned && (
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
          {!mySigned && (
            <Button onClick={handleSign} disabled={!canSign || signing}>
              {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
              Semneaza
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PvPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getPvFileSignedUrl(path).then(setUrl).catch(() => setUrl(null));
  }, [path]);
  return (
    <div className="aspect-square rounded-md overflow-hidden bg-muted">
      {url ? <img src={url} alt="PV" className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-muted" />}
    </div>
  );
}