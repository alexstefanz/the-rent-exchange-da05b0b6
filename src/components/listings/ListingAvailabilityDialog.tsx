import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Product } from "@/features/products/productsApi";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

const toDate = (s: string) => new Date(s + "T00:00:00");
const toIso = (d: Date) => format(d, "yyyy-MM-dd");

const ListingAvailabilityDialog = ({ product, open, onOpenChange, onSaved }: Props) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const [mode, setMode] = useState<"immediate" | "from_date">("immediate");
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(undefined);
  const [blocked, setBlocked] = useState<Date[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!product) return;
    const hasFrom = !!product.available_from;
    setMode(hasFrom ? "from_date" : "immediate");
    setAvailableFrom(hasFrom ? toDate(product.available_from!) : undefined);
    setBlocked((product.blocked_dates || []).map(toDate));
  }, [product]);

  const save = async () => {
    if (!product) return;
    if (mode === "from_date" && !availableFrom) {
      toast({ title: t("Alege o dată de început", "Pick a start date"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        available_immediately: mode === "immediate",
        available_from: mode === "from_date" && availableFrom ? toIso(availableFrom) : null,
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
          <RadioGroup
            value={mode}
            onValueChange={(v) => { setMode(v as "immediate" | "from_date"); if (v === "from_date" && !availableFrom) setPickerOpen(true); }}
            className="space-y-2"
          >
            <label
              htmlFor="avail-immediate"
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                mode === "immediate" ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <RadioGroupItem id="avail-immediate" value="immediate" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{t("Disponibil imediat", "Available immediately")}</div>
                <div className="text-xs text-muted-foreground">{t("Apare în căutări de la publicare", "Appears in search after publishing")}</div>
              </div>
            </label>

            <label
              htmlFor="avail-from"
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                mode === "from_date" ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <RadioGroupItem id="avail-from" value="from_date" className="mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium">{t("Disponibil începând cu data", "Available starting on")}</div>
                <div className="text-xs text-muted-foreground mb-2">{t("Apare în căutări începând cu această dată", "Appears in search starting on this date")}</div>
              </div>
            </label>
          </RadioGroup>
            <div className="pl-10 -mt-1">
                {mode === "from_date" && (
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("w-full justify-start font-normal", !availableFrom && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableFrom
                          ? availableFrom.toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB")
                          : t("Alege data", "Pick a date")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={availableFrom}
                        onSelect={(d) => { setAvailableFrom(d); setPickerOpen(false); }}
                        disabled={{ before: new Date(new Date().setHours(0,0,0,0)) }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
            </div>

          <div className="rounded-xl border border-border p-2">
            <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t("Zile blocate", "Blocked days")}</div>
            <div className="px-2 pb-1 text-xs text-muted-foreground">{t("Selectează zilele în care produsul nu e disponibil (concediu, revizie, reparații).", "Select days when the item is unavailable (holiday, service, repairs).")}</div>
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