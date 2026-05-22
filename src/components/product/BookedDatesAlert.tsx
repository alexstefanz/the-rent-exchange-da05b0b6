import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { CalendarX2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  dates: Date[];
  onClose: () => void;
}

const BookedDatesAlert = ({ open, dates, onClose }: Props) => {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const visible = sorted.slice(0, 6);
  const extra = Math.max(0, sorted.length - visible.length);

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <CalendarX2 className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-center">
            {t("Perioada conține zile rezervate", "Period contains booked days")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t(
              "Intervalul ales se suprapune cu rezervări existente. Te rugăm să alegi o altă perioadă disponibilă.",
              "The selected range overlaps with existing bookings. Please choose another available period."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {visible.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {t("Zile rezervate în interval:", "Booked days in range:")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visible.map((d) => (
                <span
                  key={d.toISOString()}
                  className="inline-flex items-center rounded-full bg-destructive/10 text-destructive text-xs font-medium px-2.5 py-1"
                >
                  {format(d, "d MMM", { locale })}
                </span>
              ))}
              {extra > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1">
                  {t(`+ încă ${extra}`, `+ ${extra} more`)}
                </span>
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full">
            {t("Alege altă perioadă", "Pick another period")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BookedDatesAlert;