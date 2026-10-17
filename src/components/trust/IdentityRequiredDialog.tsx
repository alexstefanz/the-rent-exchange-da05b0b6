import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function IdentityRequiredDialog({
  open,
  onOpenChange,
  action = "rent",
}: { open: boolean; onOpenChange: (o: boolean) => void; action?: "rent" | "publish" }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Verifică-ți identitatea</DialogTitle>
          <DialogDescription className="text-center">
            {action === "publish"
              ? "Pentru siguranța comunității, poți publica anunțuri doar după ce îți verifici identitatea cu actul și un selfie."
              : "Pentru siguranța comunității, poți închiria doar după ce îți verifici identitatea cu actul și un selfie."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Mai târziu</Button>
          <Button className="w-full" onClick={() => navigate("/verificare")}>Începe verificarea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
