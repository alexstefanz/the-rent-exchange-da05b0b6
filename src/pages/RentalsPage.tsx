import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User as UserIcon, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RentalsTab from "@/components/dashboard/RentalsTab";
import { Button } from "@/components/ui/button";
import { BannedBanner } from "@/components/common/BannedBanner";

const RentalsPage = () => {
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
        <BannedBanner className="mb-6" context="Contul tău este suspendat. Nu poți face rezervări noi." />
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
              <UserIcon className="h-3 w-3" />
              {t("Ca chiriaș", "As renter")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("Închirierile mele", "My rentals")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("Produsele pe care le-ai închiriat de la alți utilizatori", "Products you have rented from other users")}
            </p>
          </div>
        </div>
        <RentalsTab />
      </main>
      <Footer />
    </div>
  );
};

export default RentalsPage;
