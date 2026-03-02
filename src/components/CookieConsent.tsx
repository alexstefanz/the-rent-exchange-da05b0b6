import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_KEY = "rentli_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-fade-up">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-xl p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              {language === "en"
                ? "We use cookies to ensure the proper functioning of our website and to improve your experience. Essential cookies are necessary for the site to work. Performance cookies help us optimize the platform."
                : "Folosim cookie-uri pentru a asigura funcționarea corectă a site-ului și pentru a îmbunătăți experiența dumneavoastră. Cookie-urile esențiale sunt necesare funcționării site-ului. Cookie-urile de performanță ne ajută să optimizăm platforma."}
              {" "}
              <Link to="/politica-cookies" className="text-primary hover:underline font-medium">
                {language === "en" ? "Cookie Policy" : "Politica privind Cookie-urile"}
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={handleAccept} size="sm" className="w-full sm:w-auto">
                {language === "en" ? "Accept all" : "Acceptă toate"}
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm" className="w-full sm:w-auto">
                {language === "en" ? "Reject non-essential" : "Respinge neesențiale"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
