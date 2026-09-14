import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileCheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const status = searchParams.get("status") || "success";
  const { language } = useLanguage();

  const deepLink = `rentli://checkout?status=${encodeURIComponent(status)}${
    sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""
  }`;

  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = deepLink;
    }, 100);
    return () => clearTimeout(t);
  }, [deepLink]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h1 className="font-heading text-xl font-semibold">
        {language === "en" ? "Returning to app…" : "Te redirecționăm în aplicație…"}
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        {language === "en"
          ? "If the app doesn't open automatically, tap below."
          : "Dacă nu se deschide automat, apasă mai jos."}
      </p>
      <Button asChild>
        <a href={deepLink}>
          {language === "en" ? "Return to Rentli app" : "Revino în aplicația Rentli"}
        </a>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/">{language === "en" ? "Go to website" : "Mergi pe site"}</Link>
      </Button>
    </div>
  );
};

export default MobileCheckoutReturn;
