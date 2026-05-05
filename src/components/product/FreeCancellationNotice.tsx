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
              ? "Anulează gratuit cu 48h înainte de începerea închirierii. Rambursare parțială după. Consultă"
              : "Cancel for free up to 48h before the rental starts. Partial refund after. See the"}{" "}
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