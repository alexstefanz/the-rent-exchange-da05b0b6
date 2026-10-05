import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  publicId?: string | null;
  onSign: (signatureDataUrl: string) => Promise<void>;
  onOpenContract?: () => void;
}

export default function ContractSignDialog({ open, onOpenChange, publicId, onSign, onOpenContract }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [agree, setAgree] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    setBusy(true);
    try {
      await onSign(sigRef.current.getTrimmedCanvas().toDataURL("image/png"));
      toast.success("Contract semnat.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Nu s-a putut semna contractul.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" />Semnează contractul {publicId}</DialogTitle>
          <DialogDescription>Desenează semnătura cu degetul sau cu mouse-ul în chenarul de mai jos.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border-2 border-dashed border-border bg-background">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            onEnd={() => setHasInk(true)}
            canvasProps={{ className: "w-full h-44 rounded-xl touch-none" }}
          />
        </div>
        <Button variant="ghost" size="sm" className="self-start" onClick={() => { sigRef.current?.clear(); setHasInk(false); }}>
          <Eraser className="h-4 w-4 mr-1" />Șterge
        </Button>
        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          <span>
            Am citit și accept{" "}
            {onOpenContract ? <button type="button" className="underline text-primary" onClick={onOpenContract}>contractul de închiriere</button> : "contractul de închiriere"}
            {" "}și anexele acestuia. Semnătura electronică are valoarea semnăturii olografe.
          </span>
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Renunță</Button>
          <Button disabled={!agree || !hasInk || busy} onClick={submit}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSignature className="h-4 w-4 mr-1" />}Semnează contractul
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
