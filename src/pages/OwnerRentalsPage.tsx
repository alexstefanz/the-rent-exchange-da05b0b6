import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Store, Package, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RentalsOutTab from "@/components/dashboard/RentalsOutTab";
import { Button } from "@/components/ui/button";
import { BannedBanner } from "@/components/common/BannedBanner";

const OwnerRentalsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const isCompletedView = status === "completed";

  const title = useMemo(
    () => (isCompletedView ? "Închirieri încheiate — Rentli" : "Închirieri active — Rentli"),
    [isCompletedView]
  );

  usePageSeo({ title, description: "Zona privată a contului tău Rentli.", noindex: true });

  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 pt-24 lg:pt-8">
        <BannedBanner className="mb-6" context="Contul tău este suspendat." />
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Store className="h-3 w-3" />
              {t("Ca proprietar", "As owner")}
            </div>
            <h1 className="font-bold tracking-tight text-lg">{t("Istoric închirieri", "Rental history")}</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("Toate rezervările pe anunțurile tale", "All bookings on your listings")}
            </p>
          </div>
        </div>
        {user ? <RentalsOutTab /> : null}
      </main>
      <Footer />
    </div>
  );
};

export default OwnerRentalsPage;