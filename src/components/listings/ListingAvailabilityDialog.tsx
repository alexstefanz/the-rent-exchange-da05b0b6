import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Product } from "@/features/products/productsApi";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

const toDate = (s: string) => new Date(s + "T00:00:00");
const toIso = (d: Date) => d.toISOString().slice(0, 10);

const ListingAvailabilityDialog = ({ product, open, onOpenChange, onSaved }: Props) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const [available, setAvailable] = useState(true);
  const [blocked, setBlocked] = useState<Date[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setAvailable(product.available_immediately ?? true);
    setBlocked((product.blocked_dates || []).map(toDate));
  }, [product]);

  const save = async () => {
    if (!product) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        available_immediately: available,
        blocked_dates: blocked.map(toIso),
      } as any)
      .eq("id", product.id);
    setSaving(false);
    if (error) {
      toast({ title: t("Eroare la salvare", "Save failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("Disponibilitate actualizată", "Availability updated") });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Disponibilitate", "Availability")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-medium">{t("Disponibil imediat", "Available immediately")}</div>
              <div className="text-xs text-muted-foreground">{t("Apare în căutări", "Appears in search")}</div>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </label>

          <div className="rounded-xl border border-border p-2">
            <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t("Zile blocate", "Blocked days")}</div>
            <Calendar
              mode="multiple"
              selected={blocked}
              onSelect={(d) => setBlocked(d || [])}
              className="pointer-events-auto"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("Anulează", "Cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Salvează", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListingAvailabilityDialog;