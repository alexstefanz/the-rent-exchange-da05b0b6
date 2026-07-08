import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export type ReportCategory =
  | "inappropriate_language"
  | "harassment"
  | "threats"
  | "fraud"
  | "spam"
  | "other";

interface Props {
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportMessageDialog({ messageId, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [category, setCategory] = useState<ReportCategory>("inappropriate_language");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("Trebuie să fii autentificat", "You must be logged in"));
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("message_reports").insert({
      message_id: messageId,
      reporter_id: user.id,
      category,
      reason: details.trim().slice(0, 500) || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("Nu s-a putut trimite raportul", "Could not submit report"));
      return;
    }
    toast.success(t("Mulțumim! Raportul a fost trimis echipei de moderare.", "Thanks! The report was sent to moderators."));
    setDetails("");
    setCategory("inappropriate_language");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Raportează mesajul", "Report message")}</DialogTitle>
          <DialogDescription>
            {t(
              "Spune-ne ce este în neregulă. Echipa noastră va analiza și va lua măsuri.",
              "Tell us what's wrong. Our team will review and take action."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Motiv", "Reason")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate_language">{t("Limbaj licențios / injurii", "Offensive language / insults")}</SelectItem>
                <SelectItem value="harassment">{t("Hărțuire / agresiune", "Harassment / aggression")}</SelectItem>
                <SelectItem value="threats">{t("Amenințări", "Threats")}</SelectItem>
                <SelectItem value="fraud">{t("Tentativă de fraudă", "Fraud attempt")}</SelectItem>
                <SelectItem value="spam">{t("Spam / reclame", "Spam / ads")}</SelectItem>
                <SelectItem value="other">{t("Altceva", "Other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("Detalii (opțional)", "Details (optional)")}</Label>
            <Textarea
              maxLength={500}
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("Adaugă context dacă e necesar...", "Add context if needed...")}
            />
            <p className="text-xs text-muted-foreground text-right">{details.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("Anulează", "Cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("Trimite raport", "Send report")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
