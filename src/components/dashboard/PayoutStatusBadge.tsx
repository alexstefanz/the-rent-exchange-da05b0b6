import { Wallet, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const ps = (paymentStatus || "").toLowerCase();
  const rs = (rentalStatus || "").toLowerCase();

  let tone: Tone = "neutral";
  let Icon = Clock;
  let label = "Plată în așteptare";
  let tooltip = "Plata nu a fost încă inițiată.";

  if (ps === "paid" || ps === "captured") {
    tone = "success";
    Icon = Wallet;
    label = `În wallet · ${amount} RON`;
    tooltip = `Suma de ${amount} RON a fost transferată în balanța ta.`;
  } else if (ps === "authorized") {
    tone = "info";
    Icon = Clock;
    label = "Plată autorizată";
    tooltip = `${amount} RON sunt blocați pe cardul chiriașului. Vor intra în wallet după confirmarea returnării.`;
  } else if (ps === "refunded") {
    tone = "warning";
    Icon = XCircle;
    label = "Refundat";
    tooltip = "Plata a fost returnată chiriașului. Nu vei primi payout pentru această rezervare.";
  } else if (ps === "failed" || rs === "cancelled") {
    tone = "danger";
    Icon = AlertCircle;
    label = "Plată eșuată";
    tooltip = "Plata nu a putut fi procesată sau rezervarea a fost anulată.";
  } else if (rs === "completed") {
    // Completed but payment not captured — flag for follow-up
    tone = "warning";
    Icon = AlertCircle;
    label = "Payout în procesare";
    tooltip = "Rezervarea e finalizată dar captura plății nu s-a încheiat încă. Reîncearcă în câteva minute sau contactează suportul.";
  } else if (ps === "pending") {
    tone = "neutral";
    Icon = Clock;
    label = "Plată în așteptare";
    tooltip = "Așteptăm confirmarea plății de la chiriaș.";
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