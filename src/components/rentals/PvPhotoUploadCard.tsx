import { useEffect, useState } from "react";
import { Camera, FileText, Loader2, Upload, X, Lock, MessageSquare, Eye } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  getPvDocument,
  addPvPhoto,
  removePvPhoto,
  uploadPvPhoto,
  getPvFileSignedUrl,
  type PvDocument,
} from "@/features/rentals/rentalDetailPageApi";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import { MIN_PV_PHOTOS } from "@/lib/pvContent";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  rental: RentalFullDetail;
  phase: "handover" | "return";
  role: "owner" | "renter";
  onOpenDocument: () => void;
  onOpenChat: () => void;
}

export default function PvPhotoUploadCard({ rental, phase, role, onOpenDocument, onOpenChat }: Props) {
  const [pv, setPv] = useState<PvDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const uploaderRole: "owner" | "renter" = phase === "handover" ? "owner" : "renter";
  const isUploader = role === uploaderRole;

  async function refresh() {
    const d = await getPvDocument(rental.id, phase);
    setPv(d);
  }

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));

    const ch = supabase
      .channel(`pv-upload-${rental.id}-${phase}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_pv_documents", filter: `rental_id=eq.${rental.id}` },
        () => { refresh(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rental.id, phase]);

  const photos = pv?.photos_meta?.map((m) => m.path) || [];
  const photoCount = photos.length;
  const enough = photoCount >= MIN_PV_PHOTOS;

  async function handleAddPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const arr = Array.from(files);
      for (const f of arr) {
        const path = await uploadPvPhoto(f, rental.id, phase);
        await addPvPhoto({ rentalId: rental.id, phase, role, path });
      }
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Eroare la incarcare");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(path: string) {
    try {
      await removePvPhoto({ rentalId: rental.id, phase, path });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Eroare la stergere");
    }
  }

  const titleLabel = phase === "handover" ? "Fotografii la predare" : "Fotografii la returnare";
  const helperLabel = phase === "handover"
    ? `Adauga ${MIN_PV_PHOTOS} fotografii ale produsului inainte de predare. Vor fi atasate procesului verbal.`
    : `Adauga ${MIN_PV_PHOTOS} fotografii ale produsului inainte de returnare. Vor fi atasate procesului verbal.`;
  const statusBoxTitle = phase === "handover" ? "Plata efectuata — pregateste predarea" : "Returnare initiata — pregateste predarea catre proprietar";
  const statusBoxText = phase === "handover"
    ? `🤝 Clientul a platit. Adauga cele ${MIN_PV_PHOTOS} fotografii ale produsului, apoi genereaza PV-ul de predare.`
    : `📦 Ai initiat returnarea. Adauga cele ${MIN_PV_PHOTOS} fotografii ale produsului, apoi genereaza PV-ul de returnare.`;

  // Non-uploader (the other party) — show waiting card.
  if (!isUploader) {
    const otherLabel = uploaderRole === "owner" ? "proprietarul" : "chiriasul";
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 grid place-items-center shrink-0">
            <Lock className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {phase === "handover" ? "PV de predare" : "PV de returnare"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Asteptam {otherLabel} sa adauge fotografiile produsului si sa genereze procesul verbal. Apoi vei putea verifica si semna pentru a aproba.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
          <Button variant="outline" onClick={onOpenChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuta in chat
          </Button>
          {enough && (
            <Button onClick={onOpenDocument} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Vezi PV
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Photo card */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="h-4 w-4 text-foreground" />
          <h3 className="font-heading font-semibold text-foreground">{titleLabel}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {helperLabel.split(String(MIN_PV_PHOTOS)).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <strong>{MIN_PV_PHOTOS} fotografii</strong>}
            </span>
          ))}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: Math.max(MIN_PV_PHOTOS, photoCount) + (photoCount >= MIN_PV_PHOTOS ? 1 : 0) }).map((_, idx) => {
                const path = photos[idx];
                return path ? (
                  <PhotoSlot key={path} path={path} index={idx} onRemove={() => handleRemove(path)} />
                ) : (
                  <EmptySlot key={`empty-${idx}`} index={idx} disabled={uploading} onPick={(files) => handleAddPhotos(files)} />
                );
              })}
            </div>

            <label className={`mt-3 block w-full ${uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => { handleAddPhotos(e.target.files); e.target.value = ""; }}
              />
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors px-4 py-2.5 text-sm font-medium text-foreground">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Incarca poze ({photoCount} · min {MIN_PV_PHOTOS})
              </span>
            </label>

            <p className="mt-3 text-xs text-muted-foreground">
              Fotografiaza doar bunul. Nu include fete de persoane, numere de inmatriculare sau documente fara acordul scris al persoanelor vizate (GDPR art. 6 si Codul Civil art. 73).
            </p>
          </>
        )}
      </section>

      {/* Status / generate card */}
      <section className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5">
        {phase !== "handover" && (
          <>
            <h4 className="font-semibold text-foreground mb-1">{statusBoxTitle}</h4>
            <p className="text-sm text-muted-foreground mb-4">{statusBoxText}</p>
          </>
        )}
        {enough ? (
          <Button onClick={onOpenDocument} className="w-full h-12 text-base bg-foreground text-background hover:bg-foreground/90">
            <FileText className="h-5 w-5 mr-2" />
            Genereaza proces verbal
          </Button>
        ) : (
          <Button disabled className="w-full h-12 text-base bg-muted-foreground/30 text-muted-foreground" variant="secondary">
            <FileText className="h-5 w-5 mr-2" />
            Adauga pozele ({photoCount}/{MIN_PV_PHOTOS})
          </Button>
        )}
      </section>
    </div>
  );
}

function EmptySlot({ index, disabled, onPick }: { index: number; disabled: boolean; onPick: (files: FileList | null) => void }) {
  return (
    <label className={`relative aspect-[4/3] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2 ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => { onPick(e.target.files); e.target.value = ""; }}
      />
      <Camera className="h-6 w-6 text-primary/60" />
      <span className="text-sm text-muted-foreground">Adauga poza {index + 1}</span>
    </label>
  );
}

function PhotoSlot({ path, index, onRemove }: { path: string; index: number; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { getPvFileSignedUrl(path).then(setUrl).catch(() => setUrl(null)); }, [path]);
  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted group">
      {url ? (
        <img src={url} alt={`Poza ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Sterge poza"
      >
        <X className="h-4 w-4" />
      </button>
      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-0.5">Poza {index + 1}</span>
    </div>
  );
}