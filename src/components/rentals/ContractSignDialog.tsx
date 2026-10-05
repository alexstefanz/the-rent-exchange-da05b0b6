import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, FileSignature, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rentalId?: string;
  publicId?: string | null;
  onSign: (signatureDataUrl: string, code: string) => Promise<void>;
  onOpenContract?: () => void;
}

export default function ContractSignDialog({ open, onOpenChange, rentalId, publicId, onSign, onOpenContract }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [sent, setSent] = useState<{ phone: string; ref: string } | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [agree, setAgree] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setStep(1); setCode(""); setAgree(false); setHasInk(false); } }, [open]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (!rentalId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contract-otp", { body: { rental_id: rentalId } });
      const payload: any = data ?? (error as any)?.context && (await (error as any).context.json().catch(() => null));
      if (!payload?.success) {
        if (payload?.retryIn) setCooldown(payload.retryIn);
        throw new Error(payload?.message || payload?.error || "Nu s-a putut trimite codul.");
      }
      setSent({ phone: payload.phone, ref: payload.ref });
      setCooldown(60);
      toast.success(`Cod trimis la ${payload.phone}`);
    } catch (e: any) {
      toast.error(e?.message || "Nu s-a putut trimite codul.");
    } finally { setSending(false); }
  };

  const submit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    setBusy(true);
    try {
      await onSign(sigRef.current.getTrimmedCanvas().toDataURL("image/png"), code);
      toast.success("Contract validat prin SMS și semnat.");
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message || "Nu s-a putut semna contractul.";
      toast.error(msg);
      if (/cod/i.test(msg)) setStep(1);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" />Semnează contractul {publicId}</DialogTitle>
          <DialogDescription>Pasul {step} din 2 · {step === 1 ? "Validare prin cod SMS" : "Semnătură olografă"}</DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm flex gap-2">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <span>Pentru dovada acceptării, trimitem un cod de 6 cifre pe telefonul din profilul tău.</span>
            </div>
            {sent && (
              <p className="text-xs text-muted-foreground">Cod trimis la <b>{sent.phone}</b> · Referință <b>{sent.ref}</b></p>
            )}
            <Button variant={sent ? "outline" : "default"} className="w-full" disabled={sending || cooldown > 0} onClick={sendCode}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-1" />}
              {cooldown > 0 ? `Retrimite în ${cooldown}s` : sent ? "Retrimite codul" : "Trimite codul prin SMS"}
            </Button>
            {sent && (
              <Input
                inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Cod din 6 cifre"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-[0.4em]"
              />
            )}
          </div>
        ) : (
          <>
            <div className="rounded-xl border-2 border-dashed border-border bg-background">
              <SignatureCanvas ref={sigRef} penColor="black" onEnd={() => setHasInk(true)}
                canvasProps={{ className: "w-full h-44 rounded-xl touch-none" }} />
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
          </>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Renunță</Button>
              <Button disabled={code.length !== 6} onClick={() => setStep(2)}>Continuă</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Înapoi</Button>
              <Button disabled={!agree || !hasInk || busy} onClick={submit}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSignature className="h-4 w-4 mr-1" />}Validează și semnează
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
