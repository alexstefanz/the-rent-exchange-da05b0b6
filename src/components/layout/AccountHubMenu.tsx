import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck,
  Wallet,
  Package,
  User,
  FileText,
  Shield,
  HelpCircle,
  ShieldCheck,
  PlusCircle,
  LogOut,
  Eye,
  EyeOff,
  Star,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  Heart,
  PackageCheck,
  Store,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccountDashboard } from "@/hooks/useAccountDashboard";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";
import { useDrawerStats } from "@/hooks/queries/useDrawerStats";
import { useIsBanned } from "@/hooks/useIsBanned";
import { BannedBadge } from "@/components/common/BannedBadge";
import { BannedBanner } from "@/components/common/BannedBanner";
import { cn } from "@/lib/utils";

/* ---------- helpers ---------- */

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function getInitialsFrom(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() || "?";
  return "?";
}

/* ---------- pieces ---------- */

function HeaderCard({
  name,
  email,
  avatarUrl,
  verified,
  rating,
  reviewsCount,
  memberSince,
  completion,
  onNav,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  memberSince: string | null;
  completion: number;
  onNav: (path: string) => void;
}) {
  const { t } = useLanguage();
  const initials = getInitialsFrom(name, email);
  const memberYear = memberSince ? new Date(memberSince).getFullYear() : null;
  return (
    <button
      onClick={() => onNav("/contul-meu")}
      className="group block w-full rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-4 text-left transition-all hover:from-primary/15"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-primary/30">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-base">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            {verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="h-3 w-3" /> {t("Verificat", "Verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="h-3 w-3" /> {t("Neverificat", "Unverified")}
              </span>
            )}
            {reviewsCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
            {memberYear && <span>· {t("din", "since")} {memberYear}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span>{t("Profil", "Profile")} {completion}%</span>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            {t("Vezi cont", "View account")} →
          </span>
        </div>
        <Progress value={completion} className="h-1.5" />
      </div>
    </button>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  badge,
  highlight,
  onClick,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  badge?: number;
  highlight?: boolean;
  onClick: () => void;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "success"
        ? "text-emerald-600"
        : "text-primary";
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border border-border/60 bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]",
        highlight && "border-primary/40 shadow-sm",
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", toneClass)} />
        {badge && badge > 0 ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-foreground leading-tight">{value}</div>
      <div className="text-muted-foreground leading-tight text-sm font-semibold text-black">{label}</div>
    </button>
  );
}

function NavRow({
  to,
  icon: Icon,
  label,
  badge,
  badgeTone = "primary",
  onNav,
  className,
}: {
  to: string;
  icon: any;
  label: string;
  badge?: React.ReactNode;
  badgeTone?: "primary" | "warning" | "destructive";
  onNav: (path: string) => void;
  className?: string;
}) {
  const toneCls =
    badgeTone === "warning"
      ? "bg-amber-100 text-amber-700"
      : badgeTone === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : "bg-primary/15 text-primary";
  return (
    <button
      onClick={() => onNav(to)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-foreground transition-all hover:bg-primary/5 hover:translate-x-0.5",
        className,
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", toneCls)}>
          {badge}
        </span>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}

/* ---------- main component ---------- */

interface AccountHubMenuProps {
  onLogout: () => void;
}

export function AccountHubMenu({ onLogout }: AccountHubMenuProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { data, isLoading } = useAccountDashboard();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: adminSummary } = useAdminNotificationSummary();
  const { data: drawerStats } = useDrawerStats(user?.id);
  const openTickets = drawerStats?.openTickets ?? 0;
  const { isBanned } = useIsBanned();
  const adminUnread = isAdmin ? adminSummary?.unread_total ?? 0 : 0;

  const [showBalance, setShowBalance] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("show_balance") !== "false",
  );

  const toggleBalance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem("show_balance", String(next));
      return next;
    });
  };

  const profile = data?.profile;
  const signals = data?.signals;
  const trust = data?.trust;
  const health = data?.health;

  const totalActive =
    (signals?.activeRentalsAsOwner || 0) + (signals?.activeRentalsAsRenter || 0);
  const urgentActions = (signals?.actionableHandover || 0) + (signals?.pendingReturns || 0);

  const hasActivity =
    !!signals &&
    (signals.unreadMessages > 0 || totalActive > 0 || signals.kycPending || signals.ibanMissing);

  const incompleteHealth = useMemo(
    () => (health?.items || []).filter((i) => !i.done).slice(0, 3),
    [health],
  );

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || t("Utilizator", "User");
  const displayEmail = profile?.email || user?.email || "";

  /* ----- trigger button ----- */
  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className="relative hidden lg:flex items-center gap-2 rounded-full pl-1 pr-3 h-10"
      aria-label={t("Cont", "Account")}
    >
      <Avatar className="h-10 w-10 border-2 border-primary/20 transition-all hover:border-primary">
        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {getInitialsFrom(displayName, displayEmail)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{t("Contul tău", "Your account")}</span>
      {isBanned ? (
        <BannedBadge className="absolute -top-0.5 -right-0.5" />
      ) : isAdmin && adminUnread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
        </span>
      ) : hasActivity ? (
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
      ) : null}
    </Button>
  );

  /* ----- shared content ----- */
  const TopZone = (
    <div className="shrink-0 p-3 pb-2 space-y-2">
      {isBanned && <BannedBanner />}
      {isLoading || !profile ? (
        <div className="rounded-2xl bg-muted/40 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2.5 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      ) : (
        <HeaderCard
          name={displayName}
          email={displayEmail}
          avatarUrl={profile.avatar_url}
          verified={!!trust?.verified}
          rating={trust?.rating || 0}
          reviewsCount={trust?.reviewsCount || 0}
          memberSince={trust?.memberSince || null}
          completion={health?.completion || 0}
          onNav={handleNav}
        />
      )}

      {/* Quick status */}
      <div className="grid grid-cols-2 gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : (
          <>
            <StatusCard
              icon={CalendarCheck}
              label={t("active (chiriaș)", "active (renter)")}
              value={totalActive}
              highlight={totalActive > 0}
              onClick={() => handleNav("/rezervari")}
            />
            <StatusCard
              icon={Wallet}
              label={t("balanță", "balance")}
              value={
                <span className="inline-flex items-center gap-1">
                  {showBalance
                    ? `${(signals?.availableBalance || 0).toFixed(0)} RON`
                    : "•••"}
                  <span
                    role="button"
                    onClick={toggleBalance}
                    className="inline-flex items-center justify-center"
                    aria-label={
                      showBalance ? t("Ascunde", "Hide") : t("Arată", "Show")
                    }
                  >
                    {showBalance ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                </span>
              }
              tone="success"
              onClick={() => handleNav("/castiguri")}
            />
            <StatusCard
              icon={Package}
              label={t("cereri (proprietar)", "requests (owner)")}
              value={signals?.activeRentalsAsOwner || 0}
              highlight={(signals?.activeRentalsAsOwner || 0) > 0}
              onClick={() => handleNav("/inchirieri")}
            />
            <StatusCard
              icon={FileText}
              label={t("anunțurile mele", "my listings")}
              value={t("Vezi", "View")}
              onClick={() => handleNav("/anunturi")}
            />
          </>
        )}
      </div>

      {/* Primary CTA */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNav("/owner/new-product")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#F98715] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.55)] transition-all hover:shadow-[0_10px_24px_-6px_hsl(var(--primary)/0.65)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="h-4 w-4" />
          {t("Adaugă anunț", "Add a listing")}
        </button>
        {isAdmin && (
          <button
            onClick={() => handleNav("/admin")}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.55)] transition-all hover:shadow-[0_10px_24px_-6px_rgba(16,185,129,0.65)] hover:-translate-y-0.5 active:translate-y-0"
            aria-label={t("Panou Admin", "Admin Panel")}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("Panou Admin", "Admin Panel")}</span>
          </button>
        )}
      </div>
    </div>
  );

  const MiddleZone = (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2 [scrollbar-width:thin]">
      {/* Account Health */}
      {!isLoading && health && (
        <div className="rounded-xl border border-border/60 bg-card p-3">
          {incompleteHealth.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {t("Cont complet verificat", "Account fully verified")}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("Finalizează contul", "Finish setup")}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  {(health.items || []).filter((i) => i.done).length}/{health.items?.length || 0}
                </span>
              </div>
              <div className="space-y-0.5">
                {incompleteHealth.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.href)}
                    className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-xs text-foreground transition-colors hover:bg-amber-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="flex-1 text-left">
                      {t(item.labelRo, item.labelEn)}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <SectionLabel>{t("Ca chiriaș", "As renter")}</SectionLabel>
      <NavRow
        to="/rezervari"
        icon={ShoppingBag}
        label={t("Închirierile mele", "My rentals")}
        onNav={handleNav}
      />
      <NavRow
        to="/favorite"
        icon={Heart}
        label={t("Favorite", "Favorites")}
        onNav={handleNav}
      />

      <SectionLabel>{t("Ca proprietar", "As owner")}</SectionLabel>
      <NavRow
        to="/anunturi"
        icon={Package}
        label={t("Anunțurile mele", "My listings")}
        onNav={handleNav}
      />
      <NavRow
        to="/inchirieri"
        icon={PackageCheck}
        label={t("Cereri primite", "Bookings received")}
        onNav={handleNav}
      />
      <NavRow
        to="/castiguri"
        icon={CreditCard}
        label={t("Câștiguri & retrageri", "Earnings & payouts")}
        badge={signals?.ibanMissing ? t("Adaugă IBAN", "Add IBAN") : undefined}
        badgeTone="warning"
        onNav={handleNav}
      />

      <SectionLabel>{t("Cont", "Account")}</SectionLabel>
      <NavRow
        to="/contul-meu"
        icon={User}
        label={t("Contul meu", "My Account")}
        onNav={handleNav}
      />
      <NavRow
        to="/verificare"
        icon={Shield}
        label={t("Verificare KYC", "KYC Verification")}
        badge={signals?.kycPending ? t("În așteptare", "Pending") : undefined}
        badgeTone="warning"
        onNav={handleNav}
      />

      <SectionLabel>{t("Suport", "Support")}</SectionLabel>
      <NavRow
        to="/suport"
        icon={HelpCircle}
        label={t("Suport & Tickete", "Support & Tickets")}
        onNav={handleNav}
      />

    </div>
  );

  const FooterZone = (
    <div className="shrink-0 px-3 py-2 border-t border-border/60 flex items-center justify-between gap-2 bg-background">
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setLanguage("ro")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
              language === "ro"
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted",
            )}
            aria-pressed={language === "ro"}
          >
            RO
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
              language === "en"
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted",
            )}
            aria-pressed={language === "en"}
          >
            EN
          </button>
        </div>
        <button
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("Ieși din cont", "Log out")}
        </button>
    </div>
  );

  /* ----- desktop ----- */
  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[360px] p-0 bg-background border border-border/70 shadow-2xl rounded-2xl flex flex-col max-h-[min(640px,75vh)] overflow-hidden"
        >
          {TopZone}
          {MiddleZone}
          {FooterZone}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /* ----- mobile sheet (bottom) ----- */
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-10 w-10 p-0 lg:hidden"
          aria-label={t("Cont", "Account")}
        >
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitialsFrom(displayName, displayEmail)}
            </AvatarFallback>
          </Avatar>
          {hasActivity && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)] max-h-[92dvh] bg-background flex flex-col overflow-hidden"
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30" />
        {TopZone}
        {MiddleZone}
        {FooterZone}
      </SheetContent>
    </Sheet>
  );
}

export default AccountHubMenu;