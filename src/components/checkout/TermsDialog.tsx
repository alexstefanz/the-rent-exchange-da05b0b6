import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { sections } from "@/pages/legal/TermsAndConditions";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  isSubmitting?: boolean;
}

const TermsDialog = ({ open, onOpenChange, onAccept, isSubmitting }: TermsDialogProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    if (atBottom) setHasScrolledToBottom(true);
  }, []);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setHasScrolledToBottom(false);
      setAccepted(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Termeni și Condiții</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Citește termenii și condițiile până la final pentru a putea continua.
          </p>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
          style={{ maxHeight: "50vh" }}
        >
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id}>
                <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
                <div className="text-sm text-muted-foreground">{section.content}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border flex-col gap-3 sm:flex-col">
          <div className="flex items-center gap-2">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              disabled={!hasScrolledToBottom}
            />
            <label
              htmlFor="accept-terms"
              className={`text-sm cursor-pointer select-none ${
                !hasScrolledToBottom ? "text-muted-foreground/50" : "text-foreground"
              }`}
            >
              Am citit și accept Termenii și Condițiile
            </label>
          </div>
          {!hasScrolledToBottom && (
            <p className="text-xs text-muted-foreground">
              ↓ Derulează până la final pentru a activa caseta de bifat
            </p>
          )}
          <Button
            onClick={onAccept}
            disabled={!accepted || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Se procesează..." : "Confirmă rezervarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
