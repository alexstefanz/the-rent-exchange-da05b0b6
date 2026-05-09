import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Star, Package, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountDashboardData } from "@/hooks/useAccountDashboard";

interface Props {
  data: AccountDashboardData;
}

export function AccountHeroCard({ data }: Props) {
  const { t, language } = useLanguage();
  const { profile, trust, health } = data;

  const initials = (profile?.full_name || profile?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[12px] border bg-card shadow-sm"
    >
      {/* subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:items-center">
        {/* Avatar + identity */}
        <div className="flex items-start gap-4 lg:items-center">
          <Avatar className="h-20 w-20 border-2 border-background shadow-md">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {profile?.full_name || t("Salut!", "Hello!")}
              </h1>
              {trust.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  {t("Verificat", "Verified")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{profile?.email}</p>

            <div className="mt-3 flex items-center gap-3 flex-wrap text-sm">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{trust.rating > 0 ? trust.rating.toFixed(1) : "—"}</span>
                <span className="text-muted-foreground">
                  ({trust.reviewsCount} {t("recenzii", "reviews")})
                </span>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{trust.completedRentals}</span>
                <span className="text-muted-foreground">{t("închirieri", "rentals")}</span>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t("din", "since")} {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Completion + CTA */}
        <div className="lg:ml-auto lg:w-[320px] w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Profil completat", "Profile completion")}
            </span>
            <span className="text-sm font-bold tabular-nums">{health.completion}%</span>
          </div>
          <Progress value={health.completion} className="h-2" />
          <div className="mt-4 flex gap-2">
            <Button asChild className="bg-[#F59E0B] hover:bg-[#F98715] text-white flex-1">
              <Link to="/contul-meu">
                {t("Completează profilul", "Complete profile")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            {profile?.id && (
              <Button asChild variant="outline" size="icon">
                <Link to={`/utilizator/${profile.id}`} aria-label={t("Vezi profil public", "View public profile")}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}