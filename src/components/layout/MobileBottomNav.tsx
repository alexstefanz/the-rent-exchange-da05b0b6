import { Link, useLocation } from "react-router-dom";
import { Search, Heart, Plus, MessageCircle, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/queries/useConversations";

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: conversations } = useConversations(user?.id);
  const unreadCount = conversations?.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0) || 0;

  const tabs = [
    { to: "/cauta", icon: Search, label: t("Explorează", "Explore") },
    { to: "/profile#favorite", icon: Heart, label: t("Favorite", "Favorites") },
    { to: "/owner/new-product", icon: Plus, label: t("Adaugă", "Add"), highlight: true },
    { to: "/mesaje", icon: MessageCircle, label: "Chat", badge: unreadCount },
    { to: "/profile#contul-meu", icon: User, label: t("Cont", "Account") },
  ];

  const isActive = (to: string) => {
    if (to.includes("#")) {
      return location.pathname + location.hash === to;
    }
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background lg:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors relative ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                {tab.highlight ? (
                  <div className="w-10 h-10 rounded-full bg-[#F98715] flex items-center justify-center -mt-3 shadow-md">
                    <tab.icon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <>
                    <tab.icon className="h-5 w-5" />
                    {typeof tab.badge === "number" && tab.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileBottomNav;
