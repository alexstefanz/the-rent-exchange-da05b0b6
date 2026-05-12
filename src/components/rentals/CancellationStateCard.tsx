import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { ShieldCheck, AlertTriangle, AlertOctagon, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { computeCancellation, freeCancellationDeadline } from "@/lib/cancellationPolicy";

interface Props {
  startDate: string;
  subtotal: number;
  dailyPrice: number;
  platformFee: number;
  handoverConfirmedAt?: string | null;
  onCancel: () => Promise<void> | void;
  isCancelling?: boolean;
  /** When true, the confirm action is hidden (e.g. for the locked state). */
  hideAction?: boolean;
}

const TIER_STYLES = {
  FREE: {
    icon: ShieldCheck,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-900",
    iconColor: "text-emerald-600",
  },
  LIMITED: {
    icon: AlertOctagon,
    bg: "bg-red-50 border-red-200",
    text: "text-red-900",
    iconColor: "text-red-600",
  },
  LOCKED: {
    icon: Lock,
    bg: "bg-muted border-border",
    text: "text-foreground",
    iconColor: "text-muted-foreground",
  },
} as const;

const CancellationStateCard = ({
  startDate, subtotal, dailyPrice, platformFee, handoverConfirmedAt,
  onCancel, isCancelling, hideAction,
}: Props) => {
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const [accepted, setAccepted] = useState(false);

  const outcome = useMemo(
    () => computeCancellation({
      startDate, subtotal, dailyPrice, platformFee,
      handoverConfirmedAt: handoverConfirmedAt ?? null,
    }),
    [startDate, subtotal, dailyPrice, platformFee, handoverConfirmedAt],
  );

  const style = TIER_STYLES[outcome.tier];
  const Icon = style.icon;

  const freeDeadline = freeCancellationDeadline(startDate);
  const fmt = (d: Date) => format(d, "d MMM yyyy, HH:mm", { locale });

  let title = "";
  let description = "";
  if (outcome.tier === "FREE") {
    title = t("Anulare gratuită", "Free cancellation");
    description = t(
      `Poți anula gratuit până la ${fmt(freeDeadline)}. Vei primi ${outcome.refundAmount} RON înapoi.`,
      `You can cancel for free until ${fmt(freeDeadline)}. You'll receive ${outcome.refundAmount} RON back.`,
    );
  } else if (outcome.tier === "LIMITED") {
    title = t("Refund limitat", "Limited refund");
    description = t(
      `Sub 24h: prima zi (${outcome.ownerCompensation} RON) și taxa platformei (${outcome.platformRetention} RON) sunt nerambursabile. Vei primi ${outcome.refundAmount} RON înapoi.`,
      `Under 24h: first day (${outcome.ownerCompensation} RON) and platform fee (${outcome.platformRetention} RON) are non-refundable. You'll receive ${outcome.refundAmount} RON back.`,
    );
  } else {
    title = t("Rezervare activă", "Rental active");
    description = t(
      "Procesul verbal de predare a fost confirmat. Anularea nu mai este posibilă. Folosește returnarea anticipată sau deschide o dispută.",
      "Handover PV confirmed. Cancellation is no longer possible. Use early return or open a dispute.",
    );
  }

  const showAction = !hideAction && outcome.tier !== "LOCKED";

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 ${style.iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${style.text}`}>{title}</p>
          <p className={`mt-1 text-xs leading-relaxed ${style.text} opacity-90`}>{description}</p>
          {showAction && (
            <div className="mt-3">
              <AlertDialog onOpenChange={(open) => !open && setAccepted(false)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={outcome.tier === "FREE" ? "default" : "outline"}
                    size="sm"
                    className={outcome.tier !== "FREE" ? "border-current" : ""}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    {t("Anulează rezervarea", "Cancel rental")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Confirmă anularea", "Confirm cancellation")}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3 text-left">
                        <p>{description}</p>
                        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                          <div className="flex justify-between"><span>{t("Subtotal", "Subtotal")}</span><span>{subtotal} RON</span></div>
                          <div className="flex justify-between"><span>{t("Compensație proprietar", "Owner compensation")}</span><span>−{outcome.ownerCompensation} RON</span></div>
                          {outcome.platformRetention > 0 && (
                            <div className="flex justify-between"><span>{t("Taxă platformă reținută", "Platform fee retained")}</span><span>−{outcome.platformRetention} RON</span></div>
                          )}
                          <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>{t("Refund chiriaș", "Refund to renter")}</span><span className="text-primary">{outcome.refundAmount} RON</span></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("Banii ajung în 5–10 zile lucrătoare în metoda ta de plată.", "Funds arrive in 5–10 business days in your payment method.")}</p>
                        <label className="flex items-start gap-2 text-sm">
                          <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
                          <span>{t("Înțeleg politica de anulare și sumele de mai sus.", "I understand the cancellation policy and the amounts above.")}</span>
                        </label>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("Renunță", "Keep rental")}</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={!accepted}
                      onClick={async (e) => {
                        e.preventDefault();
                        await onCancel();
                      }}
                    >
                      {t("Confirmă anularea", "Confirm cancellation")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancellationStateCard;