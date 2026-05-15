import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Loader2, ChevronRight } from "lucide-react";
import { useKycGate } from "@/hooks/queries/useKycGate";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate: () => void;
}

export function DrawerKycPill({ onNavigate }: Props) {
  const { t } = useLanguage();
  const { status, isVerified, isPending, isInProgress, isRejected, hasUser, loading } =
    useKycGate();

  if (!hasUser || loading) return null;

  let tone: "red" | "amber" | "green" = "red";
  let Icon = ShieldAlert;
  let label = t("Verifică-ți identitatea", "Verify your identity");
  let hint = t("Necesar pentru plăți & încredere", "Required for payouts & trust");

  if (isVerified) {
    tone = "green";
    Icon = ShieldCheck;
    label = t("Identitate verificată", "Identity verified");
    hint = t("Cont complet", "Account complete");
  } else if (isPending || isInProgress) {
    tone = "amber";
    Icon = Loader2;
    label = t("Verificare în curs", "Verification in progress");
    hint =
      status === "IN_PROGRESS"
        ? t("Continuă procesul KYC", "Continue your KYC")
        : t("În așteptare admin", "Awaiting admin review");
  } else if (isRejected) {
    tone = "red";
    Icon = ShieldAlert;
    label = t("Verificare respinsă", "Verification rejected");
    hint = t("Reia procesul", "Retry the process");
  }

  const toneCls =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50/60 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/60 text-amber-700"
        : "border-destructive/30 bg-destructive/10 text-destructive";

  const iconBg =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-destructive/15 text-destructive";

  return (
    <Link
      to="/verificare"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm active:scale-[.99]",
        toneCls,
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
        <Icon className={cn("h-4.5 w-4.5", tone === "amber" && isInProgress && "animate-spin")} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">{label}</span>
        <span className="block text-[11px] opacity-80 leading-tight mt-0.5">{hint}</span>
      </span>
      {!isVerified && <ChevronRight className="h-4 w-4 opacity-70" />}
    </Link>
  );
}