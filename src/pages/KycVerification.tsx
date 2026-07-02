import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import KycInlineFlow from "@/components/kyc/KycInlineFlow";

const KycVerification = () => {
  usePageSeo({ title: "Verificare identitate — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8 px-4 pt-20 lg:pt-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/contul-meu")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Înapoi la cont", "Back to account")}
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t("Verificare identitate", "Identity Verification")}
          </h1>
        </div>

        <KycInlineFlow variant="page" />
      </main>
      <Footer />
    </div>
  );
};

export default KycVerification;
