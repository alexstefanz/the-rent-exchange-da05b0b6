import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useContractAcceptance } from "./useContractAcceptance";

interface Props {
  rentalId: string;
  publicId?: string | null;
  isOwner: boolean;
  onOpenContract: () => void;
  t: (ro: string, en: string) => string;
}

export default function ContractAcceptanceBlock({ rentalId, publicId, isOwner, onOpenContract, t }: Props) {
  const { owner, renter, accept } = useContractAcceptance(rentalId);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = isOwner ? owner : renter;
  const other = isOwner ? renter : owner;
  const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy HH:mm");

  const onAccept = async () => {
    setBusy(true);
    try { await accept(); toast.success(t("Contract semnat și validat.", "Contract signed and validated.")); }
    catch (e: any) { toast.error(e?.message || t("Nu s-a putut valida contractul.", "Could not validate the contract.")); }
    finally { setBusy(false); }
  };

  const Row = ({ label, at }: { label: string; at: string | null }) => (
    <li className="flex items-center gap-2 text-sm">
      {at ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{at ? `· ${t("acceptat", "accepted")} ${fmt(at)}` : `· ${t("în așteptare", "pending")}`}</span>
    </li>
  );

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground mb-2">
        {t(`Contract nr. ${publicId ?? ""} · generat după confirmarea plății`, `Contract no. ${publicId ?? ""} · generated after payment`)}
      </p>
      <ul className="space-y-1">
        <Row label={t("Proprietar", "Owner")} at={owner} />
        <Row label={t("Chiriaș", "Renter")} at={renter} />
      </ul>
      {!mine ? (
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
            <span>
              {t("Am citit și accept ", "I have read and accept ")}
              <button type="button" className="underline text-primary" onClick={onOpenContract}>{t("contractul de închiriere", "the rental contract")}</button>
              {t(" și anexele acestuia.", " and its annexes.")}
            </span>
          </label>
          <Button size="sm" disabled={!agree || busy} onClick={onAccept}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
            {t("Semnează și validează contractul", "Sign and validate the contract")}
          </Button>
        </div>
      ) : !other ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t(`Ai acceptat contractul. Se așteaptă ${isOwner ? "chiriașul" : "proprietarul"}.`, `You accepted. Waiting for the ${isOwner ? "renter" : "owner"}.`)}
        </p>
      ) : (
        <p className="mt-2 text-xs font-semibold text-primary">{t("Contract validat de ambele părți.", "Contract validated by both parties.")}</p>
      )}
    </div>
  );
}
