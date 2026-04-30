import { Wallet, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface PayoutStatusBadgeProps {
  paymentStatus: string;
  rentalStatus: string;
  amount: number;
  className?: string;
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
};

/**
 * Owner-facing badge that shows where the rental money currently is:
 * - authorized: held on renter's card, not yet captured
 * - captured / paid: captured by Stripe, payout added to wallet
 * - refunded / failed: not in wallet
 */
const PayoutStatusBadge = ({
  paymentStatus,
  rentalStatus,
  amount,
  className,
}: PayoutStatusBadgeProps) => {
  const { t } = useLanguage();
  const ps = (paymentStatus || "").toLowerCase();
  const rs = (rentalStatus || "").toLowerCase();

  let tone: Tone = "neutral";
  let Icon = Clock;
  let label = t("Plată în așteptare", "Payment pending");
  let tooltip = t("Plata nu a fost încă inițiată.", "Payment has not been initiated yet.");

  if (ps === "paid" || ps === "captured") {
    tone = "success";
    Icon = Wallet;
    label = t(`În wallet · ${amount} RON`, `In wallet · ${amount} RON`);
    tooltip = t(`Suma de ${amount} RON a fost transferată în balanța ta.`, `${amount} RON has been transferred to your balance.`);
  } else if (ps === "authorized") {
    tone = "info";
    Icon = Clock;
    label = t("Plată autorizată", "Payment authorized");
    tooltip = t(`${amount} RON sunt blocați pe cardul chiriașului. Vor intra în wallet după confirmarea returnării.`, `${amount} RON is held on the renter's card. It will be transferred to your wallet after the return is confirmed.`);
  } else if (ps === "refunded") {
    tone = "warning";
    Icon = XCircle;
    label = t("Refundat", "Refunded");
    tooltip = t("Plata a fost returnată chiriașului. Nu vei primi payout pentru această rezervare.", "The payment was refunded to the renter. You will not receive a payout for this reservation.");
  } else if (ps === "failed" || rs === "cancelled") {
    tone = "danger";
    Icon = AlertCircle;
    label = t("Plată eșuată", "Payment failed");
    tooltip = t("Plata nu a putut fi procesată sau rezervarea a fost anulată.", "Payment could not be processed or the reservation was cancelled.");
  } else if (rs === "completed") {
    // Completed but payment not captured — flag for follow-up
    tone = "warning";
    Icon = AlertCircle;
    label = t("Payout în procesare", "Payout processing");
    tooltip = t("Rezervarea e finalizată dar captura plății nu s-a încheiat încă. Reîncearcă în câteva minute sau contactează suportul.", "The reservation is complete but the payment capture has not finished yet. Try again in a few minutes or contact support.");
  } else if (ps === "pending") {
    tone = "neutral";
    Icon = Clock;
    label = t("Plată în așteptare", "Payment pending");
    tooltip = t("Așteptăm confirmarea plății de la chiriaș.", "Waiting for the renter to confirm the payment.");
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              toneClasses[tone],
              className,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PayoutStatusBadge;