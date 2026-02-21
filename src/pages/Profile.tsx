import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, UserCog, ClipboardList, ShoppingBag, Package, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountTab from "@/components/profile/AccountTab";
import EarningsTab from "@/components/profile/EarningsTab";
import FavoritesTab from "@/components/profile/FavoritesTab";
import RequestsTab from "@/components/dashboard/RequestsTab";
import RentalsTab from "@/components/dashboard/RentalsTab";
import LendingsTab from "@/components/dashboard/LendingsTab";

const VALID_HASHES = ["contul-meu", "cereri", "inchirieri", "anunturi", "castiguri", "favorite"];

const TABS = [
  { id: "contul-meu", labelRo: "Contul meu", labelEn: "My Account", icon: UserCog },
  { id: "cereri", labelRo: "Cereri", labelEn: "Requests", icon: ClipboardList },
  { id: "inchirieri", labelRo: "Rezervări", labelEn: "Rentals", icon: ShoppingBag },
  { id: "anunturi", labelRo: "Produse active", labelEn: "Active Listings", icon: Package },
  { id: "castiguri", labelRo: "Câștiguri", labelEn: "Earnings", icon: Wallet },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;

  // Fetch pending requests count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-requests-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });


  // Get tab from URL hash or default to first tab
  const getTabFromHash = () => {
    const hash = location.hash.replace("#", "");
    if (VALID_HASHES.includes(hash)) return hash;
    return TABS[0].id;
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  // Update tab when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`#${value}`, { replace: true });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
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
        {/* Page Header */}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/50 p-1 rounded-lg mb-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const badgeCount = tab.id === "cereri" ? pendingCount : 0;
              const showBadge = badgeCount > 0;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  <Icon className="h-4 w-4" />
                  <span>
                    {language === "ro" ? tab.labelRo : tab.labelEn}
                  </span>
                  {showBadge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1">
                      {badgeCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="contul-meu" className="mt-0">
            <AccountTab />
          </TabsContent>

          <TabsContent value="cereri" className="mt-0">
            <RequestsTab />
          </TabsContent>

          <TabsContent value="inchirieri" className="mt-0">
            <RentalsTab />
          </TabsContent>

          <TabsContent value="anunturi" className="mt-0">
            <LendingsTab />
          </TabsContent>

          <TabsContent value="castiguri" className="mt-0">
            <EarningsTab />
          </TabsContent>

          <TabsContent value="favorite" className="mt-0">
            <FavoritesTab />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
