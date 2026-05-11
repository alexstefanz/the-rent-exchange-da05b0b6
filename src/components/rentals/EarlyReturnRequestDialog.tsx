import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  rentalId: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
}

const EarlyReturnRequestDialog = ({ rentalId, onSuccess, trigger }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 20) {
      toast.error(t("Te rugăm să descrii motivul (minim 20 caractere).", "Please describe the reason (min 20 characters)."));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-early-return", {
        body: { rental_id: rentalId, reason: reason.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("Cererea a fost trimisă proprietarului.", "Request sent to the owner."));
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || t("Cererea nu a putut fi trimisă.", "Request could not be sent."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Solicită returnare anticipată", "Request early return")}</DialogTitle>
          <DialogDescription>
            {t(
              "Returnarea anticipată nu garantează rambursarea perioadei neutilizate. Decizia aparține proprietarului.",
              "Early return does not guarantee a refund for the unused period. The decision belongs to the owner.",
            )}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("Spune proprietarului de ce vrei să returnezi mai devreme…", "Tell the owner why you want to return early…")}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("Anulează", "Cancel")}</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("Trimite cererea", "Send request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EarlyReturnRequestDialog;