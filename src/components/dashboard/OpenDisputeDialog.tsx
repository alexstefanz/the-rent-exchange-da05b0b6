import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUxCopy } from "@/hooks/useUxCopy";
import { openRentalDispute } from "@/features/rentals/ownerRentalsApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalId: string;
  phase: "handover" | "return";
}

export default function OpenDisputeDialog({ open, onOpenChange, rentalId, phase }: Props) {
  const copy = useUxCopy();
  const t = copy.timeline.dispute;
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reason.trim().length >= 30 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await openRentalDispute(rentalId, phase, reason.trim());
      toast.success(t.success);
      qc.invalidateQueries({ queryKey: ["my-rentals"] });
      qc.invalidateQueries({ queryKey: ["ownerRentals"] });
      qc.invalidateQueries({ queryKey: ["accountDashboard"] });
      setReason("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase === "handover" ? t.phaseHandover : t.phaseReturn}
              </p>
            </div>
          </div>
          <DialogDescription className="pt-2">{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t.reasonLabel}</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
            rows={5}
            maxLength={1000}
            disabled={submitting}
          />
          <p className="text-[11px] text-muted-foreground text-right">{reason.length}/1000</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? t.submitting : t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}