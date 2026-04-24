import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import KycRejectedBanner from "@/components/kyc/KycRejectedBanner";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import MobileBottomNav from "./MobileBottomNav";
import logoImage from "@/assets/rentli_logo.webp";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: profile } = useCurrentUserProfile();
  const { data: conversations } = useConversations(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const unreadMessagesCount = conversations?.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0) || 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(() => {
    return localStorage.getItem("show_balance") !== "false";
  });

  const { data: balance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user!.id)
        .eq("status", "completed");
      if (error) throw error;
      let total = 0;
      for (const tx of data || []) {
        if (tx.type === "owner_payout") total += Number(tx.amount);
        else if (tx.type === "withdrawal") total -= Number(tx.amount);
      }
      return total;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

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

  const toggleMobileCategory = (categoryId: number) => {
    setExpandedMobileCategory(expandedMobileCategory === categoryId ? null : categoryId);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedMobileCategory(null);
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
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={logoImage} alt="Rentli" width={120} height={40} className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation - centered */}
          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:flex">
            <Link to="/categorii" className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              {t("Explorează", "Explore")}
            </Link>
            <Link to="/cum-functioneaza" className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              {t("Cum funcționează", "How it works")}
            </Link>
            <Link to="/despre-noi" className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              {t("Despre noi", "About us")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Language Switcher - Desktop */}
            <div className="hidden lg:flex">
              <LanguageSwitcher />
            </div>

            {loading ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-lg" />
            ) : user ? (
              <>
                {/* Notification Bell - Desktop */}
                <div className="hidden lg:flex">
                  <NotificationBell />
                </div>

                {/* User Avatar Dropdown - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden lg:flex rounded-full h-10 w-10 p-0">
                      <Avatar className="h-9 w-9 border-2 border-primary/20 transition-all hover:border-primary">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background">
                    {/* User Info Header */}
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-medium text-sm truncate">
                        {profile?.full_name || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Balance Display */}
                    <Link to="/castiguri" className="px-3 py-2 border-b border-border flex items-center gap-2 hover:bg-muted transition-colors cursor-pointer">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {showBalance ? `${(balance ?? 0).toFixed(2)} RON` : "••••••"}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBalance(e); }}
                        className="ml-auto p-1 rounded hover:bg-muted transition-colors"
                        aria-label={showBalance ? t("Ascunde balanța", "Hide balance") : t("Arată balanța", "Show balance")}
                      >
                        {showBalance ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </Link>

                    {/* Chat Button */}
                    <DropdownMenuItem asChild>
                      <Link to="/mesaje" className="flex items-center gap-3 py-2 relative">
                        <MessageCircle className="h-4 w-4" />
                        Chat
                        {unreadMessagesCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
                            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    {/* Admin Button */}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-3 py-2 text-green-600 font-semibold focus:text-green-600">
                          <ShieldCheck className="h-4 w-4" />
                          {t("Panou Admin", "Admin Panel")}
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* Profile Section */}
                    <DropdownMenuItem asChild>
                      <Link to="/profile#contul-meu" className="flex items-center gap-3 py-2">
                        <User className="h-4 w-4" />
                        {t("Contul meu", "My Account")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/owner" className="flex items-center gap-3 py-2">
                        <FileText className="h-4 w-4" />
                        {t("Anunțurile mele", "My Listings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/inchirieri" className="flex items-center gap-3 py-2">
                        <Package className="h-4 w-4" />
                        {t("Închirieri", "Lendings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/rezervari" className="flex items-center gap-3 py-2">
                        <CalendarCheck className="h-4 w-4" />
                        {t("Rezervări", "Reservations")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorite" className="flex items-center gap-3 py-2">
                        <Heart className="h-4 w-4" />
                        {t("Favorite", "Favorites")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Actions Section */}
                    <DropdownMenuItem asChild>
                      <Link to="/owner/new-product" className="flex items-center gap-3 py-2">
                        <PlusCircle className="h-4 w-4" />
                        {t("Adaugă un anunț", "Add a listing")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/verificare" className="flex items-center gap-3 py-2">
                        <Shield className="h-4 w-4" />
                        {t("Verificare KYC", "KYC Verification")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/suport" className="flex items-center gap-3 py-2">
                        <HelpCircle className="h-4 w-4" />
                        {t("Suport & Tickete", "Support & Tickets")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 py-2 text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" />
                      {t("Ieși din cont", "Log out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="hidden lg:flex" asChild>
                <Link to="/auth">{t("Autentificare", "Login")}</Link>
              </Button>
            )}

            {/* Add button - Desktop only */}
            <Button size="sm" className="hidden lg:flex" asChild>
              <Link to="/owner/new-product">
                <Plus className="h-4 w-4" />
                {t("Adaugă", "Add")}
              </Link>
            </Button>
            
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
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

      </header>

      <KycRejectedBanner />

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
      />

      {/* Off-canvas Mobile Menu */}
      <div 
        className={`fixed top-0 left-0 z-50 h-full w-[85%] max-w-[320px] bg-background shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <Link to="/" onClick={closeMobileMenu}>
              <img src={logoImage} alt="Rentli" width={96} height={32} className="h-8 w-auto" />
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeMobileMenu}
              className="text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* User info for mobile */}
              {user && profile && (
                <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Language Switcher for Mobile */}
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("Limbă", "Language")}:</span>
                <LanguageSwitcher />
              </div>
              
              <div className="mb-2 flex flex-col gap-1 pb-3 border-b border-border">
                <Link 
                  to="/cauta" 
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                  onClick={closeMobileMenu}
                >
                  <Search className="h-5 w-5" />
                  {t("Caută", "Search")}
                </Link>
                <Link 
                  to="/owner/new-product" 
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                  onClick={closeMobileMenu}
                >
                  <PlusCircle className="h-5 w-5" />
                  {t("Adaugă Anunț", "Add Listing")}
                </Link>
              </div>
              <div className="mb-4 flex flex-col gap-2">
              {user && (
                  <>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50" 
                        onClick={closeMobileMenu}
                      >
                        <ShieldCheck className="h-5 w-5" />
                        {t("Panou Admin", "Admin Panel")}
                      </Link>
                    )}
                    <Link 
                      to="/contul-meu" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <User className="h-5 w-5" />
                      {t("Contul meu", "My Account")}
                    </Link>
                    <Link 
                      to="/owner" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <FileText className="h-5 w-5" />
                      {t("Anunțurile mele", "My Listings")}
                    </Link>
                    <Link 
                      to="/inchirieri" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <Package className="h-5 w-5" />
                      {t("Închirieri", "Lendings")}
                    </Link>
                    <Link 
                      to="/rezervari" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <CalendarCheck className="h-5 w-5" />
                      {t("Rezervări", "Reservations")}
                    </Link>
                    <Link 
                      to="/mesaje" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {t("Mesaje", "Messages")}
                      {unreadMessagesCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                          {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                    <Link 
                      to="/favorite" 
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                      onClick={closeMobileMenu}
                    >
                      <Heart className="h-5 w-5" />
                      {t("Favorite", "Favorites")}
                    </Link>
                  </>
                )}
                <Link 
                  to="/verificare"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                  onClick={closeMobileMenu}
                >
                  <Shield className="h-5 w-5" />
                  {t("Verificare KYC", "KYC Verification")}
                </Link>
                <Link 
                  to="/suport" 
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  onClick={closeMobileMenu}
                >
                  <HelpCircle className="h-5 w-5" />
                  {t("Suport & Tickete", "Support & Tickets")}
                </Link>
              </div>
              
              <div className="border-t border-border pt-4">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("Categorii", "Categories")}
                </p>
                <div className="flex flex-col">
                  {categories.map(category => {
                    const Icon = getCategoryIcon(category.id);
                    const isExpanded = expandedMobileCategory === category.id;
                    return (
                      <div key={category.id} className="border-b border-border/50 last:border-b-0">
                        <button 
                          onClick={() => toggleMobileCategory(category.id)} 
                          className={`flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-medium transition-colors ${
                            isExpanded ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            {category.name}
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[500px]" : "max-h-0"}`}>
                          <div className="bg-muted/30 px-3 py-3">
                            <div className="flex flex-col gap-1">
                              {category.subcategories.map(sub => (
                                <Link 
                                  key={sub.id} 
                                  to={`/subcategorie/${sub.id}`} 
                                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" 
                                  onClick={closeMobileMenu}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                            <Link 
                              to={`/categorie/${category.slug}`} 
                              className="mt-3 flex items-center gap-1 px-3 text-sm font-medium text-primary hover:underline" 
                              onClick={closeMobileMenu}
                            >
                              {t("Vezi toate", "View all")}
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="border-t border-border p-4">
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("Deconectare", "Log out")}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth" onClick={closeMobileMenu}>
                  {t("Autentificare", "Login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
};

export default Navbar;
