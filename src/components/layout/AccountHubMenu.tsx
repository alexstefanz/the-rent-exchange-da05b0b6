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
  MessageCircle,
  CalendarCheck,
  Wallet,
  Package,
  Heart,
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
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccountDashboard } from "@/hooks/useAccountDashboard";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import LanguageSwitcher from "./LanguageSwitcher";
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
      <div className="text-[10.5px] text-muted-foreground leading-tight">{label}</div>
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
        "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground transition-all hover:bg-primary/5 hover:translate-x-0.5",
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
    <div className="px-2.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
  const { t } = useLanguage();
  const { data, isLoading } = useAccountDashboard();
  const { data: isAdmin } = useIsAdmin(user?.id);

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
      size="icon"
      className="relative rounded-full h-10 w-10 p-0 hidden lg:flex"
      aria-label={t("Cont", "Account")}
    >
      <Avatar className="h-9 w-9 border-2 border-primary/20 transition-all hover:border-primary">
        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitialsFrom(displayName, displayEmail)}
        </AvatarFallback>
      </Avatar>
      {hasActivity && (
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
      )}
    </Button>
  );

  /* ----- shared content ----- */
  const Body = (
    <div className="flex flex-col">
      {/* Header */}
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
      <div className="grid grid-cols-2 gap-2 mt-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : (
          <>
            <StatusCard
              icon={MessageCircle}
              label={t("mesaje noi", "new messages")}
              value={signals?.unreadMessages || 0}
              badge={signals?.unreadMessages}
              highlight={(signals?.unreadMessages || 0) > 0}
              onClick={() => handleNav("/mesaje")}
            />
            <StatusCard
              icon={CalendarCheck}
              label={t("rezervări active", "active bookings")}
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
            {urgentActions > 0 ? (
              <StatusCard
                icon={AlertTriangle}
                label={t("acțiuni urgente", "urgent actions")}
                value={urgentActions}
                highlight
                tone="warning"
                onClick={() => handleNav("/inchirieri")}
              />
            ) : (
              <StatusCard
                icon={Package}
                label={t("anunțurile mele", "my listings")}
                value={t("Vezi", "View")}
                onClick={() => handleNav("/owner")}
              />
            )}
          </>
        )}
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => handleNav("/owner/new-product")}
        className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary to-[#F98715] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.55)] transition-all hover:shadow-[0_10px_24px_-6px_hsl(var(--primary)/0.65)] hover:-translate-y-0.5 active:translate-y-0"
      >
        <PlusCircle className="h-4 w-4" />
        {t("Adaugă anunț", "Add a listing")}
      </button>

      {/* Account Health */}
      {!isLoading && health && (
        <div className="mt-3 rounded-xl border border-border/60 bg-card p-3">
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

      {/* Grouped nav */}
      <SectionLabel>{t("Activitate", "Activity")}</SectionLabel>
      <NavRow
        to="/mesaje"
        icon={MessageCircle}
        label="Chat"
        badge={signals?.unreadMessages ? signals.unreadMessages : undefined}
        badgeTone="destructive"
        onNav={handleNav}
      />
      <NavRow
        to="/inchirieri"
        icon={Package}
        label={t("Închirieri", "Lendings")}
        badge={signals?.activeRentalsAsOwner || undefined}
        onNav={handleNav}
      />
      <NavRow
        to="/rezervari"
        icon={CalendarCheck}
        label={t("Rezervări", "Reservations")}
        badge={signals?.activeRentalsAsRenter || undefined}
        onNav={handleNav}
      />
      <NavRow to="/favorite" icon={Heart} label={t("Favorite", "Favorites")} onNav={handleNav} />

      <SectionLabel>{t("Cont", "Account")}</SectionLabel>
      <NavRow
        to="/contul-meu"
        icon={User}
        label={t("Contul meu", "My Account")}
        onNav={handleNav}
      />
      <NavRow
        to="/owner"
        icon={FileText}
        label={t("Anunțurile mele", "My Listings")}
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
      <NavRow
        to="/castiguri"
        icon={CreditCard}
        label={t("Plăți & Retrageri", "Payouts")}
        badge={signals?.ibanMissing ? t("Adaugă IBAN", "Add IBAN") : undefined}
        badgeTone="warning"
        onNav={handleNav}
      />
      <NavRow
        to="/notificari"
        icon={Bell}
        label={t("Notificări", "Notifications")}
        badge={data?.notifications?.unread || undefined}
        badgeTone="destructive"
        onNav={handleNav}
      />

      <SectionLabel>{t("Suport", "Support")}</SectionLabel>
      <NavRow
        to="/suport"
        icon={HelpCircle}
        label={t("Suport & Tickete", "Support & Tickets")}
        onNav={handleNav}
      />

      {isAdmin && (
        <>
          <SectionLabel>Admin</SectionLabel>
          <NavRow
            to="/admin"
            icon={ShieldCheck}
            label={t("Panou Admin", "Admin Panel")}
            onNav={handleNav}
            className="text-emerald-600 hover:text-emerald-700"
          />
        </>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <LanguageSwitcher />
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
          className="w-[360px] p-3 bg-background border border-border/70 shadow-2xl rounded-2xl"
        >
          {Body}
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
        className="rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[92dvh] overflow-y-auto bg-background"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
        {Body}
      </SheetContent>
    </Sheet>
  );
}

export default AccountHubMenu;