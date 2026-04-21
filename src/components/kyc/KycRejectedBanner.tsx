import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKycGate } from "@/hooks/queries/useKycGate";
import { useLanguage } from "@/contexts/LanguageContext";

const DISMISS_KEY = "kyc_rejected_dismissed";

const KycRejectedBanner = () => {
  const { isRejected, hasUser, loading } = useKycGate();
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (loading || !hasUser || !isRejected) return null;
  if (dismissed) return null;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/verificare") || pathname.startsWith("/kyc")) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const isRo = language === "ro";
  const message = isRo
    ? "Verificarea identității a fost respinsă."
    : "Identity verification was rejected.";
  const cta = isRo ? "Refă KYC-ul" : "Redo KYC";
  const dismissLabel = isRo ? "Închide" : "Dismiss";

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/30">
      <div className="container mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive-foreground/90 font-medium truncate">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button asChild size="sm" className="h-8">
            <Link to="/verificare">
              {cta}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/20"
            onClick={handleDismiss}
            aria-label={dismissLabel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KycRejectedBanner;