import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, CheckCircle2, Clock, ClipboardCheck, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  type InspectionChecklist,
  type InspectionChecklistKey,
  INSPECTION_CHECKLIST_KEYS,
  emptyChecklist,
  countChecked,
} from "@/features/rentals/inspectionApi";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useUxCopy } from "@/hooks/useUxCopy";

function InspectionImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
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
  renter: "Chirias",
};

function getPhaseLabel(phase: InspectionPhase, role: InspectionRole): string {
  if (phase === "checkout") return role === "owner" ? "Predare" : "Primire";
  return role === "renter" ? "Confirma predarea" : "Confirmare primire";
}

function getPhaseDescription(phase: InspectionPhase, role: InspectionRole): string {
  if (phase === "checkout") {
    return role === "owner"
      ? "Fotografiaza produsul in momentul in care il predai chiriasului. Pozele servesc drept dovada in caz de disputa."
      : "Fotografiaza produsul in momentul in care il primesti de la proprietar. Pozele servesc drept dovada in caz de disputa.";
  }
  return role === "renter"
    ? "Fotografiaza produsul in momentul in care il predai inapoi proprietarului. Pozele sunt dovada ta ca l-ai returnat in starea convenita."
    : "Fotografiaza produsul in momentul in care il primesti inapoi. Pozele servesc drept dovada in caz de disputa.";
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
  const copy = useUxCopy();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<InspectionChecklist>(() => emptyChecklist());
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
  const checkoutOwnerInspection = phase === "checkin"
    ? existingInspections.find((i) => i.phase === "checkout" && i.role === "owner")
    : null;

  const checklistItems = copy.inspection.checklist.items as Record<InspectionChecklistKey, string>;
  const checkedCount = countChecked(checklist);
  const allChecked = checkedCount === INSPECTION_CHECKLIST_KEYS.length;
  const trimmedNotes = notes.trim();
  const notesValid = trimmedNotes.length >= 20;
  const checklistValid = allChecked || notesValid;
  const canSubmit = photos.length > 0 && checklistValid && !isSubmitting && !isUploading;

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
        toast.error("Eroare la incarcarea imaginii");
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error("Adauga cel putin o poza");
      return;
    }
    if (!checklistValid) {
      toast.error(copy.inspection.checklist.notesRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      await createInspection(rentalId, phase, role, photos, notes || undefined, checklist);
      toast.success("Inspectia a fost salvata cu succes!");
      queryClient.invalidateQueries({ queryKey: ["inspections", rentalId] });
      setPhotos([]);
      setNotes("");
      setChecklist(emptyChecklist());
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Eroare la salvarea inspectiei");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherRoleLabel = role === "owner" ? "Chirias" : "Proprietar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {getPhaseLabel(phase, role)} - {productTitle}
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
              <span className="font-medium">Ai completat inspectia ({roleLabels[role]})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {myExisting.photos.map((url, i) => (
                <InspectionImage key={i} src={url} alt={`Inspectie ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
              ))}
            </div>
            <ChecklistSummary
              checklist={myExisting.checklist}
              labels={checklistItems}
              title={copy.inspection.checklist.title}
            />
            {myExisting.notes && (
              <p className="text-sm text-muted-foreground">{myExisting.notes}</p>
            )}

            {otherParty ? (
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{otherRoleLabel} a completat inspectia</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {otherParty.photos.map((url, i) => (
                    <InspectionImage key={i} src={url} alt={`Inspectie ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
                  ))}
                </div>
                <ChecklistSummary
                  checklist={otherParty.checklist}
                  labels={checklistItems}
                  title={copy.inspection.checklist.title}
                />
                {otherParty.notes && (
                  <p className="text-sm text-muted-foreground">{otherParty.notes}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{otherRoleLabel} nu a completat inca inspectia</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {checkoutOwnerInspection && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  {(copy.inspection.checklist.checkoutSummary as (n: number) => string)(countChecked(checkoutOwnerInspection.checklist))}
                </div>
                {checkoutOwnerInspection.notes && (
                  <p className="text-muted-foreground mt-1">{checkoutOwnerInspection.notes}</p>
                )}
              </div>
            )}

            {otherParty && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{otherRoleLabel} a completat inspectia</span>
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
                  <InspectionImage key={i} src={url} alt={`Poza ${i + 1}`} className="rounded-lg aspect-square object-cover border w-full" />
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
                  Se incarca...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Adauga poze ({photos.length}/{MAX_PHOTOS})
                </>
              )}
            </Button>

            <div className="rounded-lg border bg-card p-3 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{copy.inspection.checklist.title}</h4>
                <span className="ml-auto text-xs text-muted-foreground">
                  {checkedCount}/{INSPECTION_CHECKLIST_KEYS.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{copy.inspection.checklist.helper}</p>
              <div className="space-y-2.5">
                {INSPECTION_CHECKLIST_KEYS.map((key) => (
                  <div key={key} className="flex items-start gap-2">
                    <Checkbox
                      id={`chk-${key}`}
                      checked={checklist[key]}
                      onCheckedChange={(v) =>
                        setChecklist((prev) => ({ ...prev, [key]: v === true }))
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor={`chk-${key}`} className="text-sm leading-snug cursor-pointer">
                      {checklistItems[key]}
                    </Label>
                  </div>
                ))}
              </div>
              {!allChecked && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  {copy.inspection.checklist.notesRequired}
                </p>
              )}
            </div>

            <Textarea
              placeholder="Observatii (optional daca toate sunt bifate; obligatorii altfel - ex: zgarietura pe coltul stang)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {!myExisting && !isLoading && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuleaza
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Salveaza inspectia
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChecklistSummary({
  checklist,
  labels,
  title,
}: {
  checklist: InspectionChecklist;
  labels: Record<InspectionChecklistKey, string>;
  title: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-sm">{title}</h4>
        <span className="ml-auto text-xs text-muted-foreground">
          {countChecked(checklist)}/{INSPECTION_CHECKLIST_KEYS.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {INSPECTION_CHECKLIST_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm">
            {checklist[key] ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <XIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <span className={checklist[key] ? "text-foreground" : "text-muted-foreground line-through"}>
              {labels[key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
