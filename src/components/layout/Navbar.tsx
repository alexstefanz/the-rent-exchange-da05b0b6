import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  User, 
  LogOut, 
  FileText, 
  MessageCircle,
  CalendarCheck,
  Package,
  Heart,
  PlusCircle,
  HelpCircle,
  Globe,
  ShieldCheck,
  Shield,
  Wallet,
  Eye,
  EyeOff
} from "lucide-react";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { useConversations } from "@/hooks/queries/useConversations";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { useIsBanned } from "@/hooks/useIsBanned";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import NotificationBell from "./NotificationBell";
import MobileBottomNav from "./MobileBottomNav";
import { AccountHubMenu } from "./AccountHubMenu";
import { MobileDrawer } from "./mobile-drawer/MobileDrawer";
import LanguageSwitcher from "./LanguageSwitcher";
import logoImage from "@/assets/rentli_logo.webp";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: profile } = useCurrentUserProfile();
  const { data: conversations } = useConversations(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { isBanned } = useIsBanned();
  const unreadMessagesCount = conversations?.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0) || 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(() => {
    return localStorage.getItem("show_balance") !== "false";
  });

  const { data: walletData } = useWalletBalance();
  const balance = walletData?.available ?? 0;

  const toggleBalance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBalance(prev => {
      const next = !prev;
      localStorage.setItem("show_balance", String(next));
      return next;
    });
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleMegaMenuEnter = (categoryId: number) => {
    setActiveMegaMenu(categoryId);
  };

  const handleMegaMenuLeave = () => {
    setActiveMegaMenu(null);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: t("Deconectat", "Logged out"),
      description: t("Te-ai deconectat cu succes", "You have been logged out successfully"),
    });
    navigate("/");
    closeMobileMenu();
  };

  const activeCategory = categories.find(c => c.id === activeMegaMenu);

  return (
    <>
      <header className="fixed lg:sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
        {/* Main navbar */}
        <div className="container relative h-16 flex items-center justify-between gap-[10px] px-[10px]">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <img src={logoImage} alt="Rentli" width={120} height={40} className="h-10 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-lg" />
            ) : user ? (
              <>
                {/* Chat - Desktop */}
                {isBanned ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex relative gap-2 opacity-50 cursor-not-allowed"
                    disabled
                    title="Cont suspendat"
                    aria-label="Chat indisponibil — cont suspendat"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="hidden lg:flex relative gap-2" asChild>
                    <Link to="/mesaje" aria-label="Chat">
                      <MessageCircle className="h-5 w-5" />
                      <span>Chat</span>
                      {unreadMessagesCount > 0 && (
                        <span className="ml-1 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                )}

                {/* Favorites - Desktop */}
                <Button variant="ghost" size="icon" className="hidden lg:flex" asChild>
                  <Link to="/favorite" aria-label={t("Favorite", "Favorites")}>
                    <Heart className="h-6 w-6" />
                  </Link>
                </Button>

                {/* Notification Bell - Desktop */}
                <div className="hidden lg:flex">
                  <NotificationBell />
                </div>

                {/* Premium Account Hub */}
                <AccountHubMenu onLogout={handleLogout} />
              </>
            ) : (
              <>
                <div className="hidden lg:flex">
                  <LanguageSwitcher />
                </div>
                <Button variant="ghost" size="sm" className="hidden lg:flex" asChild>
                  <Link to="/auth">{t("Autentificare", "Login")}</Link>
                </Button>
              </>
            )}

            {/* Add button - Desktop only */}
            {isBanned ? (
              <Button
                size="sm"
                className="hidden lg:flex opacity-50 cursor-not-allowed"
                disabled
                title="Cont suspendat — nu poți publica anunțuri"
              >
                <Plus className="h-4 w-4" />
                {t("Adaugă anunț nou", "Add listing")}
              </Button>
            ) : (
              <Button size="sm" className="hidden lg:flex" asChild>
                <Link to="/owner/new-product">
                  <Plus className="h-4 w-4" />
                  {t("Adaugă anunț nou", "Add listing")}
                </Link>
              </Button>
            )}
            
            {/* Notification Bell - Mobile/Tablet */}
            {user && (
              <div className="lg:hidden">
                <NotificationBell />
              </div>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

      </header>


      <MobileDrawer open={isMobileMenuOpen} onClose={closeMobileMenu} onLogout={handleLogout} />


      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
};

export default Navbar;
