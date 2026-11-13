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
  ShieldCheck,
  PlusCircle,
  LogOut,
  Star,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
  Package,
  CalendarCheck,
  ArrowUpRight,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccountDashboard } from "@/hooks/useAccountDashboard";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";
import { useDrawerStats } from "@/hooks/queries/useDrawerStats";
import { useIsBanned } from "@/hooks/useIsBanned";
import { BannedBadge } from "@/components/common/BannedBadge";
import { BannedBanner } from "@/components/common/BannedBanner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleMenuCards } from "./RoleMenuCards";

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
      onClick={() => onNav("/profile")}
      className="group block w-full rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-4 text-left transition-all hover:from-primary/15"
    >
      <div className="flex items-center gap-3 pr-24">
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
          <div className="mt-1 flex items-center gap-2 whitespace-nowrap text-[11px] text-muted-foreground">
            {verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="h-3 w-3" /> {t("Verificat cu Stripe Identity", "Verified with Stripe Identity")}
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
        <div className="flex items-center justify-between gap-2 whitespace-nowrap text-[11px] text-muted-foreground mb-1">
          <span className="shrink-0">{t("Profil", "Profile")} {completion}%</span>
          <span className="truncate opacity-70 group-hover:opacity-100 transition-opacity">
            {t("Finalizează profilul contului", "Complete your account profile")} →
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
  icon: React.ElementType;
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
  icon: React.ElementType;
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

/* ---------- shared body (desktop dropdown + mobile drawer) ---------- */

export function AccountHubBody({ onNavigate, onLogout }: { onNavigate: (path: string) => void; onLogout?: () => void }) {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { data, isLoading } = useAccountDashboard();
  const { data: walletBalance } = useWalletBalance();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: isInsurer } = useQuery({
    queryKey: ["is-insurer", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "insurer" as never });
      return !!data;
    },
  });
  const { data: drawerStats } = useDrawerStats(user?.id);
  const openTickets = drawerStats?.openTickets ?? 0;
  const { isBanned } = useIsBanned();

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("rentli:hideBalance") === "1";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("rentli:hideBalance", hideBalance ? "1" : "0");
    } catch {
      // Ignore storage write failures.
    }
  }, [hideBalance]);

  const profile = data?.profile;
  const signals = data?.signals;
  const trust = data?.trust;
  const health = data?.health;
  const availableBalance = walletBalance?.available ?? signals?.availableBalance ?? drawerStats?.balance ?? 0;

  const incompleteHealth = useMemo(
    () => (health?.items || []).filter((i) => !i.done).slice(0, 3),
    [health],
  );

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || t("Utilizator", "User");
  const displayEmail = profile?.email || user?.email || "";

  return (
    <>
      <div className="shrink-0 p-3 pb-2 space-y-2">
        {isBanned && <BannedBanner />}
        {isLoading && !user ? (
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
          <div className="relative">
          <HeaderCard
            name={displayName}
            email={displayEmail}
            avatarUrl={profile?.avatar_url ?? null}
            verified={!!trust?.verified}
            rating={trust?.rating || 0}
            reviewsCount={trust?.reviewsCount || 0}
            memberSince={trust?.memberSince || null}
            completion={health?.completion || 0}
            onNav={onNavigate}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <div className="inline-flex items-center rounded-lg border border-border/60 bg-background/80 p-0.5">
              {(["ro", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  aria-pressed={language === l}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-semibold rounded-md uppercase transition-colors",
                    language === l ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label={t("Ieși din cont", "Log out")}
                title={t("Ieși din cont", "Log out")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          </div>
        )}

        {!isLoading && profile && (
          trust?.verified ? null : (
            <button
              onClick={() => onNavigate("/verificare")}
              className="flex w-full items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-800 transition hover:border-amber-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                {(profile as any).identity_status === "processing"
                  ? t("Verificarea identității e în procesare", "Identity verification processing")
                  : t("Verifică-ți identitatea pentru a închiria și publica", "Verify your identity to rent and list")}
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("/owner/new-product")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#F98715] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.55)] transition-all hover:shadow-[0_10px_24px_-6px_hsl(var(--primary)/0.65)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="h-4 w-4" />
            {t("Adaugă anunț", "Add a listing")}
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => onNavigate("/admin")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.55)] transition-all hover:shadow-[0_10px_24px_-6px_rgba(16,185,129,0.65)] hover:-translate-y-0.5 active:translate-y-0"
            aria-label={t("Panou Admin", "Admin Panel")}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("Panou Admin", "Admin Panel")}</span>
          </button>
        )}
        {(profile as any)?.account_type === "business" && (
          <button
            onClick={() => onNavigate("/business")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Building2 className="h-4 w-4" />
            <span className="whitespace-nowrap">Rentli Business</span>
          </button>
        )}
        {isInsurer && (
          <button
            onClick={() => onNavigate("/admin/asigurari")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.55)] transition-all hover:shadow-[0_10px_24px_-6px_rgba(37,99,235,0.65)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("Portal Asigurator", "Insurer Portal")}</span>
          </button>
        )}
      </div>


      <div className="px-3 pb-2 space-y-2">
        <div
          role="link"
          tabIndex={0}
          onClick={() => onNavigate("/castiguri")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onNavigate("/castiguri");
            }
          }}
          className="group flex items-center justify-between gap-2 rounded-xl bg-zinc-900 text-white px-3 py-2 shadow-sm cursor-pointer transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {t("Balanță", "Balance")}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHideBalance((v) => !v);
                }}
                aria-label={hideBalance ? t("Afișează balanța", "Show balance") : t("Ascunde balanța", "Hide balance")}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                {hideBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            <div className="text-base font-bold tabular-nums leading-tight">
              {hideBalance ? "••••" : availableBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              <span className="ml-1 text-xs font-medium text-white/70">RON</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold group-hover:bg-primary/90">
            {t("Retrage", "Withdraw")}
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>

        <RoleMenuCards onNavigate={onNavigate} />




        <button
          onClick={() => onNavigate("/suport")}
          className="flex w-full items-center gap-3 h-12 px-4 rounded-xl bg-card border border-border/60 shadow-sm hover:border-primary/40 transition-colors"
        >
          <LifeBuoy className="h-5 w-5 text-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground text-left">
            {t("Suport & Tichete", "Support & Tickets")}
          </span>
          {openTickets > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {openTickets}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export function AccountHubMenu({ onLogout }: AccountHubMenuProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data } = useAccountDashboard();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: adminSummary } = useAdminNotificationSummary();
  const { isBanned } = useIsBanned();
  const adminUnread = isAdmin ? adminSummary?.unread_total ?? 0 : 0;

  const profile = data?.profile;
  const signals = data?.signals;

  const totalActive =
    (signals?.activeRentalsAsOwner || 0) + (signals?.activeRentalsAsRenter || 0);

  const hasActivity =
    !!signals &&
    (signals.unreadMessages > 0 || totalActive > 0 || signals.ibanMissing);

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

  const BodyContent = (
    <div className="flex-1">
      <AccountHubBody onNavigate={handleNav} onLogout={() => { setOpen(false); onLogout(); }} />
    </div>
  );

  /* ----- desktop ----- */
  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[360px] p-0 bg-background border border-border/70 shadow-2xl rounded-2xl flex flex-col overflow-visible"
        >
          {BodyContent}
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
        {BodyContent}
      </SheetContent>
    </Sheet>
  );
}

export default AccountHubMenu;