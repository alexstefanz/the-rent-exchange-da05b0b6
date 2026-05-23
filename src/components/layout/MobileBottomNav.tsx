import { Link, useLocation } from "react-router-dom";
import { Search, Heart, Plus, MessageCircle, User, Ban } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/queries/useConversations";
import { useIsBanned } from "@/hooks/useIsBanned";

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: conversations } = useConversations(user?.id);
  const { isBanned } = useIsBanned();
  const unreadCount = conversations?.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0) || 0;

  const tabs: Array<{ to: string; icon: any; label: string; highlight?: boolean; badge?: number; disabled?: boolean }> = [
    { to: "/cauta", icon: Search, label: t("Explorează", "Explore") },
    { to: "/favorite", icon: Heart, label: t("Favorite", "Favorites") },
    { to: "/owner/new-product", icon: Plus, label: t("Adaugă", "Add"), highlight: true, disabled: isBanned },
    { to: "/mesaje", icon: MessageCircle, label: "Chat", badge: unreadCount, disabled: isBanned },
    { to: "/profile#contul-meu", icon: User, label: t("Cont", "Account") },
  ];

  const isActive = (to: string) => {
    if (to.includes("#")) {
      return location.pathname + location.hash === to;
    }
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 lg:hidden rounded-full border border-white/60 bg-white/60 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          const isDisabled = (tab as any).disabled;
          const Wrapper: any = isDisabled ? "button" : Link;
          const wrapperProps: any = isDisabled
            ? { type: "button", disabled: true, title: "Cont suspendat", onClick: (e: any) => e.preventDefault() }
            : { to: tab.to };
          return (
            <Wrapper
              key={tab.to}
              {...wrapperProps}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors relative ${
                isDisabled ? "opacity-40 cursor-not-allowed" : active ? "text-primary" : "text-foreground/70"
              }`}
            >
              <div className="relative">
                {tab.highlight ? (
                  <div className={`w-9 h-9 -mt-1 rounded-full flex items-center justify-center ${isDisabled ? "bg-muted" : "bg-[#F98715] shadow-[0_6px_20px_-4px_rgba(249,135,21,0.55)]"}`}>
                    {isDisabled ? <Ban className="h-4 w-4 text-destructive" strokeWidth={2.5} /> : <tab.icon className="h-4 w-4 text-white" />}
                  </div>
                ) : (
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${active && !isDisabled ? "bg-primary/10" : ""}`}>
                    <tab.icon className="h-5 w-5" />
                    {typeof (tab as any).badge === "number" && (tab as any).badge > 0 && !isDisabled && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm">
                        {(tab as any).badge > 99 ? "99+" : (tab as any).badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span>{tab.label}</span>
            </Wrapper>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
