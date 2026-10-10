import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, FileSignature, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContractAcceptance } from "./useContractAcceptance";

interface Props {
  rentalId: string;
  publicId?: string | null;
  isOwner: boolean;
  onOpenContract: () => void;
  t: (ro: string, en: string) => string;
}

export default function ContractAcceptanceBlock({ rentalId, publicId, isOwner, onOpenContract, t }: Props) {
  const { owner, renter } = useContractAcceptance(rentalId);

  const [congrats, setCongrats] = useState(false);
  useEffect(() => {
    const h = () => setCongrats(true);
    window.addEventListener("rentli:contract-signed", h);
    return () => window.removeEventListener("rentli:contract-signed", h);
  }, []);
  const mine = isOwner ? owner : renter;
  const other = isOwner ? renter : owner;
  const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy HH:mm");

  const Row = ({ label, at }: { label: string; at: string | null }) => (
    <li className="flex items-center gap-2 text-sm">
      {at ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{at ? `· ${t("semnat", "signed")} ${fmt(at)}` : `· ${t("nesemnat", "not signed")}`}</span>
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
        <>
          <Button size="sm" className="mt-3" onClick={onOpenContract}>
            <FileSignature className="h-4 w-4 mr-1" />{t("Citește și semnează contractul", "Read & sign the contract")}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("Semnarea devine disponibilă după ce parcurgi contractul până la final.", "Signing becomes available after you scroll through the full contract.")}</p>
        </>
      ) : !other ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t(`Ai semnat contractul. Se așteaptă ${isOwner ? "chiriașul" : "proprietarul"}.`, `You signed. Waiting for the ${isOwner ? "renter" : "owner"}.`)}
        </p>
      ) : (
        <p className="mt-2 text-xs font-semibold text-primary">{t("Contract semnat de ambele părți.", "Contract signed by both parties.")}</p>
      )}

      <Dialog open={congrats} onOpenChange={setCongrats}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 grid place-items-center"><PartyPopper className="h-7 w-7 text-primary" /></div>
            <DialogTitle className="text-center">{t("Felicitări! Contractul a fost semnat", "Congratulations! The contract is signed")}</DialogTitle>
            <DialogDescription className="text-center">{t("Ambele părți au semnat contractul. Procesele-verbale de predare sunt acum deblocate.", "Both parties signed. Handover reports are now unlocked.")}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setCongrats(false)}>{t("Continuă", "Continue")}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
