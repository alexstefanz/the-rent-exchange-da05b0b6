import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContractAcceptance } from "./useContractAcceptance";
import ContractSignDialog from "./ContractSignDialog";

interface Props {
  rentalId: string;
  publicId?: string | null;
  isOwner: boolean;
  onOpenContract: () => void;
  t: (ro: string, en: string) => string;
}

export default function ContractAcceptanceBlock({ rentalId, publicId, isOwner, onOpenContract, t }: Props) {
  const { owner, renter, sign } = useContractAcceptance(rentalId);
  const [signOpen, setSignOpen] = useState(false);
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
        <Button size="sm" className="mt-3" onClick={() => setSignOpen(true)}>
          <FileSignature className="h-4 w-4 mr-1" />{t("Semnează contractul", "Sign the contract")}
        </Button>
      ) : !other ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t(`Ai semnat contractul. Se așteaptă ${isOwner ? "chiriașul" : "proprietarul"}.`, `You signed. Waiting for the ${isOwner ? "renter" : "owner"}.`)}
        </p>
      ) : (
        <p className="mt-2 text-xs font-semibold text-primary">{t("Contract semnat de ambele părți.", "Contract signed by both parties.")}</p>
      )}
      <ContractSignDialog open={signOpen} onOpenChange={setSignOpen} rentalId={rentalId} publicId={publicId} onSign={sign} onOpenContract={() => { setSignOpen(false); onOpenContract(); }} />
    </div>
  );
}
