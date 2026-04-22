import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RentalsOutTab from "@/components/dashboard/RentalsOutTab";
import { Button } from "@/components/ui/button";

const RentalsOutPage = () => {
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
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("Închirieri", "Lendings")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("Produsele tale închiriate și cererile primite", "Your rented-out products and incoming requests")}
            </p>
          </div>
        </div>
        <RentalsOutTab />
      </main>
      <Footer />
    </div>
  );
};

export default RentalsOutPage;
