import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EarningsTab from "@/components/profile/EarningsTab";
import { Button } from "@/components/ui/button";

const EarningsPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 pt-24 lg:pt-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-6">{t("Câștiguri", "Earnings")}</h1>
        <EarningsTab />
      </main>
      <Footer />
    </div>
  );
};

export default EarningsPage;
