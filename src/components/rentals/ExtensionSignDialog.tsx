import { notifyDocumentSigned } from "./DocumentSignedSuccessDialog";
import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  extensionId: string;
  publicId?: string | null;
  onSigned?: () => void;
  onOpenAnnex?: () => void;
}

/** Digital signature of Annex 3 (extension addendum) by owner or renter. */
export default function ExtensionSignDialog({ open, onOpenChange, extensionId, publicId, onSigned, onOpenAnnex }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [agree, setAgree] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!open) { setAgree(false); setHasInk(false); setErr(null); } }, [open]);

  const submit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    setBusy(true); setErr(null);
    const sig = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    const { error } = await supabase.rpc("sign_rental_extension", { _extension_id: extensionId, _signature: sig });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onOpenChange(false);
    onSigned?.();
    notifyDocumentSigned({ document: "Anexa 3 — Act adițional de prelungire", publicId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" />Semnează Anexa 3 {publicId}</DialogTitle>
          <DialogDescription>Act adițional de prelungire a contractului de locațiune.</DialogDescription>
        </DialogHeader>
        {onOpenAnnex && (
          <Button variant="link" className="px-0 h-auto self-start" onClick={onOpenAnnex}>Citește Anexa 3 înainte de semnare</Button>
        )}
        <div className="rounded-xl border border-border bg-background">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            onEnd={() => setHasInk(true)}
            canvasProps={{ className: "w-full h-40 rounded-xl" }}
          />
        </div>
        <Button variant="ghost" size="sm" className="self-start" onClick={() => { sigRef.current?.clear(); setHasInk(false); }}>
          <Eraser className="h-4 w-4 mr-1" />Șterge semnătura
        </Button>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          <span>Am citit și accept Actul adițional de prelungire (Anexa 3). Semnătura digitală are valoarea semnăturii olografe.</span>
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Renunță</Button>
          <Button disabled={!agree || !hasInk || busy} onClick={submit}>
            {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Semnează Anexa 3
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
