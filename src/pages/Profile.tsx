import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAccountDashboard } from "@/hooks/useAccountDashboard";
import { AccountHeroCard } from "@/components/profile/dashboard/AccountHeroCard";
import { QuickActions } from "@/components/profile/dashboard/QuickActions";
import { SmartCards } from "@/components/profile/dashboard/SmartCards";
import { AccountHealth } from "@/components/profile/dashboard/AccountHealth";
import { ActivityFeed } from "@/components/profile/dashboard/ActivityFeed";
import { NotificationCenter } from "@/components/profile/dashboard/NotificationCenter";
import { NavGroups } from "@/components/profile/dashboard/NavGroups";
import { DashboardSkeleton } from "@/components/profile/dashboard/DashboardSkeleton";

const ProfilePage = () => {
  usePageSeo({ title: "Profil — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useAccountDashboard();
  const { data: accountType, isLoading: typeLoading } = useQuery({
    queryKey: ["account-type", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("account_type").eq("id", user!.id).maybeSingle();
      return data?.account_type ?? null;
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (accountType === "business") return <Navigate to="/business" replace />;

  if (authLoading || (user && typeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 pt-24 lg:pt-8">
        {isLoading || !data ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <AccountHeroCard data={data} />
            <QuickActions
              unreadMessages={data.signals.unreadMessages}
              activeRentalsAsRenter={data.signals.activeRentalsAsRenter}
              activeRentalsAsOwner={data.signals.activeRentalsAsOwner}
              availableBalance={data.signals.availableBalance}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SmartCards data={data} />
                <ActivityFeed data={data} />
              </div>
              <div className="space-y-6">
                <AccountHealth data={data} />
                <NotificationCenter data={data} />
              </div>
            </div>
            <NavGroups />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
