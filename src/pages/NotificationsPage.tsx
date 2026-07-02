import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const NotificationsPage = () => {
  usePageSeo({ title: "Notificări — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

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
      <main className="flex-1 container max-w-2xl py-8 pt-24 lg:pt-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>
        <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
          <NotificationCenter variant="page" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
