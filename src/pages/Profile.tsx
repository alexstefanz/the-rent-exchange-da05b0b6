import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, UserCog, ShoppingBag, Package, ScrollText, PackageCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BalanceCard from "@/components/profile/BalanceCard";

const NAV_ITEMS = [
  { id: "contul-meu", labelRo: "Detalii cont", labelEn: "Account Details", icon: UserCog, href: "/contul-meu" },
  { id: "inchirieri", labelRo: "Rezervări", labelEn: "Reservations", icon: ShoppingBag, href: "/rezervari" },
  { id: "inchirieri-out", labelRo: "Închirieri", labelEn: "Lendings", icon: PackageCheck, href: "/inchirieri" },
  { id: "anunturi", labelRo: "Anunțuri", labelEn: "Listings", icon: Package, href: "/anunturi" },
  { id: "activitate", labelRo: "Istoric activitate", labelEn: "Activity Log", icon: ScrollText, href: "/activitate" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;

  const { data: activeLendingsCount = 0 } = useQuery({
    queryKey: ["active-lendings-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user!.id)
        .in("status", ["pending", "confirmed", "active"]);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("Contul Meu", "My Account")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              "Gestionează setările și preferințele contului tău",
              "Manage your account settings and preferences"
            )}
          </p>
        </div>

        <BalanceCard />

        {/* Navigation buttons */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const badgeCount = item.id === "inchirieri-out" ? activeLendingsCount : 0;
            const showBadge = badgeCount > 0;

            return (
              <Link
                key={item.id}
                to={item.href}
                className="relative flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-semibold rounded-lg bg-gradient-to-r from-[#F97717] to-[#FAA73C] text-white shadow-sm hover:opacity-90 transition-all"
              >
                <Icon className="h-5 w-5" />
                <span>{language === "ro" ? item.labelRo : item.labelEn}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
