import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  uploadInspectionPhoto,
  createInspection,
  getInspections,
  getInspectionSignedUrl,
  extractInspectionPath,
  type InspectionPhase,
  type InspectionRole,
  type Inspection,
} from "@/features/rentals/inspectionApi";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function InspectionImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // If it's already a blob: URL (newly uploaded preview), use it directly.
  const isBlob = src.startsWith("blob:");
  const path = extractInspectionPath(src);
  const { data: signedUrl, isLoading } = useQuery({
    queryKey: ["inspection-signed-url", path],
    queryFn: () => getInspectionSignedUrl(src),
    enabled: !isBlob && !!path,
    staleTime: 50 * 60 * 1000,
  });

  if (isBlob) return <img src={src} alt={alt} className={className} />;
  if (isLoading || !signedUrl) return <Skeleton className={className} />;
  return <img src={signedUrl} alt={alt} className={className} />;
}

interface InspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalId: string;
  phase: InspectionPhase;
  role: InspectionRole;
  productTitle: string;
}

const MAX_PHOTOS = 10;

const roleLabels: Record<InspectionRole, string> = {
  owner: "Proprietar",
  renter: "Chiriaș",
};

function getPhaseLabel(phase: InspectionPhase, role: InspectionRole): string {
  if (phase === "checkout") return role === "owner" ? "Predare" : "Primire";
  return role === "renter" ? "Returnare" : "Confirmare primire";
}

function getPhaseDescription(phase: InspectionPhase, role: InspectionRole): string {
  if (phase === "checkout") {
    return role === "owner"
      ? "Fotografiază produsul în momentul în care îl predai chiriașului. Pozele servesc drept dovadă în caz de dispută."
      : "Fotografiază produsul în momentul în care îl primești de la proprietar. Pozele servesc drept dovadă în caz de dispută.";
  }
  return role === "renter"
    ? "Fotografiază produsul înainte să îl returnezi proprietarului. Pozele servesc drept dovadă în caz de dispută."
    : "Fotografiază produsul în momentul în care îl primești înapoi. Pozele servesc drept dovadă în caz de dispută.";
}

export function InspectionDialog({
  open,
  onOpenChange,
  rentalId,
  phase,
  role,
  productTitle,
}: InspectionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingInspections = [], isLoading } = useQuery({
    queryKey: ["inspections", rentalId],
    queryFn: () => getInspections(rentalId),
    enabled: open,
  });

  const myExisting = existingInspections.find(
    (i) => i.phase === phase && i.role === role && i.user_id === user?.id
  );
  const otherParty = existingInspections.find(
    (i) => i.phase === phase && i.role !== role
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Maxim ${MAX_PHOTOS} poze permise`);
      return;
    }

    setIsUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadInspectionPhoto(file, rentalId, user.id);
        newPhotos.push(url);
      } catch (err) {
        console.error(err);
        toast.error("Eroare la încărcarea imaginii");
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error("Adaugă cel puțin o poză");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInspection(rentalId, phase, role, photos, notes || undefined);
      toast.success("Inspecția a fost salvată cu succes!");
      queryClient.invalidateQueries({ queryKey: ["inspections", rentalId] });
      setPhotos([]);
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Eroare la salvarea inspecției");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherRoleLabel = role === "owner" ? "Chiriaș" : "Proprietar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            📷 {getPhaseLabel(phase, role)} — {productTitle}
          </DialogTitle>
          <DialogDescription>
            {getPhaseDescription(phase, role)}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : myExisting ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Ai completat inspecția ({roleLabels[role]})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {myExisting.photos.map((url, i) => (
                <InspectionImage key={i} src={url} alt={`Inspecție ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
              ))}
            </div>
            {myExisting.notes && (
              <p className="text-sm text-muted-foreground">📝 {myExisting.notes}</p>
            )}

            {otherParty ? (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{otherRoleLabel} a completat inspecția</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {otherParty.photos.map((url, i) => (
                    <InspectionImage key={i} src={url} alt={`Inspecție ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
                  ))}
                </div>
                {otherParty.notes && (
                  <p className="text-sm text-muted-foreground">📝 {otherParty.notes}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{otherRoleLabel} nu a completat încă inspecția</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {otherParty && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{otherRoleLabel} a completat inspecția</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {otherParty.photos.slice(0, 4).map((url, i) => (
                    <InspectionImage key={i} src={url} alt="" className="rounded aspect-square object-cover w-full" />
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <InspectionImage key={i} src={url} alt={`Poză ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || photos.length >= MAX_PHOTOS}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Adaugă poze ({photos.length}/{MAX_PHOTOS})
                </>
              )}
            </Button>

            <Textarea
              placeholder="Observații (opțional) — ex: zgârietură pe colțul stâng"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {!myExisting && !isLoading && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || photos.length === 0}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Salvează inspecția
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
