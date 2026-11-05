import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Action = "rent" | "publish" | "accept";

const COPY: Record<Action, { title: string; desc: string }> = {
  rent: {
    title: "Verifică-ți identitatea",
    desc: "Pentru siguranța comunității, poți închiria doar după ce îți verifici identitatea cu actul și un selfie.",
  },
  publish: {
    title: "Verifică-ți identitatea",
    desc: "Pentru siguranța comunității, poți publica anunțuri doar după ce îți verifici identitatea cu actul și un selfie.",
  },
  accept: {
    title: "Verifică-ți identitatea pentru a accepta prima închiriere",
    desc: "Pentru siguranța comunității este necesară o verificare rapidă cu actul de identitate și un selfie. Cererea rămâne în așteptare, iar după verificare o poți accepta imediat.",
  },
};

export function IdentityRequiredDialog({
  open,
  onOpenChange,
  action = "rent",
}: { open: boolean; onOpenChange: (o: boolean) => void; action?: Action }) {
  const navigate = useNavigate();
  const c = COPY[action];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{c.title}</DialogTitle>
          <DialogDescription className="text-center">{c.desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Mai târziu</Button>
          <Button
            className="w-full"
            onClick={() => {
              sessionStorage.setItem("identity_return_to", window.location.pathname + window.location.search);
              onOpenChange(false);
              navigate("/verificare");
            }}
          >
            Verifică acum
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Global listener: opens the dialog when an owner tries to accept without KYC. */
export function KycRequiredListener() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("rentli:kyc-required", h);
    return () => window.removeEventListener("rentli:kyc-required", h);
  }, []);
  return <IdentityRequiredDialog open={open} onOpenChange={setOpen} action="accept" />;
}
