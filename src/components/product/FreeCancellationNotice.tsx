import { Link } from "react-router-dom";
import { ThumbsUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FreeCancellationNotice = () => {
  const { language } = useLanguage();
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          <ThumbsUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">
            {language === "ro" ? "Anulare gratuită" : "Free cancellation"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {language === "ro"
              ? "Anulare gratuită cu 24h înainte de start. Sub 24h, prima zi și taxa platformei nu se rambursează. După predarea produsului, rezervarea nu mai poate fi anulată — există returnare anticipată sau dispută. Vezi"
              : "Free cancellation up to 24h before start. Under 24h, the first day and platform fee are non-refundable. After handover, cancellation is no longer possible — only early return or dispute. See the"}{" "}
            <Link to="/politica-anulare" className="text-primary hover:underline font-medium">
              {language === "ro" ? "politica de anulare" : "cancellation policy"}
            </Link>{" "}
            {language === "ro" ? "pentru mai multe detalii." : "for more details."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FreeCancellationNotice;