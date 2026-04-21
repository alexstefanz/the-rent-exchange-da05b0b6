import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKycGate, type KycStatus } from "@/hooks/queries/useKycGate";
import { cn } from "@/lib/utils";

type Reason = "publish" | "book";

interface KycGateBannerProps {
  reason: Reason;
  className?: string;
  /** Optional preserved query string appended to /kyc redirect (e.g. ?next=/checkout) */
  nextHref?: string;
}

const COPY: Record<
  Reason,
  Record<
    "title" | "verified" | "notStarted" | "pending" | "rejected" | "cta",
    { ro: string; en: string }
  >
> = {
  publish: {
    title: { ro: "Verificare identitate necesară", en: "Identity verification required" },
    verified: { ro: "", en: "" },
    notStarted: {
      ro: "Pentru a publica un anunț, trebuie să-ți verifici identitatea. Procesul durează doar câteva minute.",
      en: "To publish an ad, you need to verify your identity. It only takes a few minutes.",
    },
    pending: {
      ro: "Identitatea ta este în curs de verificare. Vei putea publica anunțuri imediat ce este aprobată (de obicei în 24h).",
      en: "Your identity is being verified. You'll be able to publish ads as soon as it's approved (usually within 24h).",
    },
    rejected: {
      ro: "Verificarea identității a fost respinsă. Te rugăm să reîncarci documentele.",
      en: "Identity verification was rejected. Please re-upload your documents.",
    },
    cta: { ro: "Verifică-mi identitatea", en: "Verify my identity" },
  },
  book: {
    title: { ro: "Verificare identitate necesară", en: "Identity verification required" },
    verified: { ro: "", en: "" },
    notStarted: {
      ro: "Pentru a face o rezervare, trebuie să-ți verifici identitatea. Este o măsură de protecție pentru tine și proprietar.",
      en: "To make a booking, you need to verify your identity. It protects both you and the owner.",
    },
    pending: {
      ro: "Identitatea ta este în curs de verificare. Vei putea face rezervări imediat ce este aprobată (de obicei în 24h).",
      en: "Your identity is being verified. You'll be able to book as soon as it's approved (usually within 24h).",
    },
    rejected: {
      ro: "Verificarea identității a fost respinsă. Te rugăm să reîncarci documentele pentru a putea rezerva.",
      en: "Identity verification was rejected. Please re-upload your documents to be able to book.",
    },
    cta: { ro: "Verifică-mi identitatea", en: "Verify my identity" },
  },
};

const getVariant = (status: KycStatus) => {
  if (status === "REJECTED")
    return { Icon: XCircle, ring: "border-destructive/30 bg-destructive/5", iconBg: "bg-destructive/10 text-destructive" };
  if (status === "SUBMITTED" || status === "NEEDS_MANUAL_REVIEW")
    return { Icon: Clock, ring: "border-primary/30 bg-primary/5", iconBg: "bg-primary/10 text-primary" };
  return { Icon: ShieldAlert, ring: "border-primary/30 bg-primary/5", iconBg: "bg-primary/10 text-primary" };
};

const KycGateBanner = ({ reason, className, nextHref }: KycGateBannerProps) => {
  const { language } = useLanguage();
  const { status, isVerified, isPending, isRejected, loading } = useKycGate();
  const t = (s: { ro: string; en: string }) => (language === "ro" ? s.ro : s.en);

  if (loading || isVerified) return null;

  const copy = COPY[reason];
  const message = isRejected
    ? copy.rejected
    : isPending
    ? copy.pending
    : copy.notStarted;
  const { Icon, ring, iconBg } = getVariant(status);
  const kycHref = nextHref ? `/kyc?next=${encodeURIComponent(nextHref)}` : "/kyc";

  return (
    <Card className={cn("border-2 p-6 shadow-card", ring, className)}>
      <div className="flex items-start gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {t(copy.title)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t(message)}
            </p>
          </div>
          {!isPending && (
            <Button asChild size="lg" className="gap-2">
              <Link to={kycHref}>
                <ShieldCheck className="h-4 w-4" />
                {t(copy.cta)}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KycGateBanner;