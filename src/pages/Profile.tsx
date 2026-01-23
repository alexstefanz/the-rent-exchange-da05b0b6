import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, UserCog, User, MessageCircle, Wallet, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountTab from "@/components/profile/AccountTab";
import ProfileTab from "@/components/profile/ProfileTab";
import MessagesTab from "@/components/profile/MessagesTab";
import EarningsTab from "@/components/profile/EarningsTab";
import NotificationsTab from "@/components/profile/NotificationsTab";

const TABS = [
  { id: "contul-meu", labelRo: "Contul meu", labelEn: "My Account", icon: UserCog },
  { id: "profil", labelRo: "Profilul meu", labelEn: "My Profile", icon: User },
  { id: "mesaje", labelRo: "Mesaje", labelEn: "Messages", icon: MessageCircle },
  { id: "castiguri", labelRo: "Câștiguri", labelEn: "Earnings", icon: Wallet },
  { id: "notificari", labelRo: "Notificări", labelEn: "Notifications", icon: Bell },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;

  // Get tab from URL hash or default to first tab
  const getTabFromHash = () => {
    const hash = location.hash.replace("#", "");
    const validTab = TABS.find(tab => tab.id === hash);
    return validTab ? hash : TABS[0].id;
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
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === "ro" ? tab.labelRo : tab.labelEn}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="contul-meu" className="mt-0">
            <AccountTab />
          </TabsContent>

          <TabsContent value="profil" className="mt-0">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="mesaje" className="mt-0">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="castiguri" className="mt-0">
            <EarningsTab />
          </TabsContent>

          <TabsContent value="notificari" className="mt-0">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
