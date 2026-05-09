import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, MessageCircle, Calendar, Clock, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductExtendedStats } from "@/hooks/queries/useProductExtendedStats";

interface Props {
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string | null;
  isOwnProduct?: boolean;
  onStartChat: () => void;
  stats?: ProductExtendedStats;
  isLoading?: boolean;
}

const Stat = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0">
      <div className="text-sm font-semibold text-foreground leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
    </div>
  </div>
);

const OwnerTrustCard = ({ ownerId, ownerName, ownerAvatar, isOwnProduct, onStartChat, stats, isLoading }: Props) => {
  const { t, language } = useLanguage();

  const memberSince = stats?.owner_member_since ? new Date(stats.owner_member_since).getFullYear().toString() : "—";
  const rating = stats?.owner_avg_rating ? Number(stats.owner_avg_rating).toFixed(1) : "—";
  const reviewCount = stats?.owner_review_count || 0;
  const totalRentals = stats?.owner_total_rentals || 0;
  const respMin = stats?.owner_response_minutes;
  const respLabel = respMin && respMin > 0
    ? respMin < 60 ? `${Math.round(respMin)} min` : `${Math.round(respMin / 60)} h`
    : t("Rapid", "Fast");
  const respRate = stats?.owner_response_rate ? `${Math.round(stats.owner_response_rate)}%` : "—";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-primary/20">
            <AvatarImage src={ownerAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">{ownerName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-lg font-semibold text-foreground truncate">{ownerName}</h3>
            {stats?.owner_kyc_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">
                <ShieldCheck className="h-3 w-3" /> {t("Verificat", "Verified")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium text-foreground">{rating}</span>
            <span>({reviewCount} {t("recenzii", "reviews")})</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("Membru din", "Member since")} {memberSince}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat icon={TrendingUp} value={`${totalRentals}`} label={t("închirieri", "rentals")} />
        <Stat icon={Clock} value={respLabel} label={t("timp răspuns", "response time")} />
        <Stat icon={MessageCircle} value={respRate} label={t("rată răspuns", "response rate")} />
        <Stat icon={Calendar} value={memberSince} label={t("din", "since")} />
      </div>

      {!isOwnProduct && (
        <div className="mt-5 flex gap-2">
          <Button onClick={onStartChat} className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("Trimite mesaj", "Send message")}
          </Button>
          <Button asChild variant="outline">
            <Link to={`/utilizator/${ownerId}`}>{t("Vezi profil", "View profile")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default OwnerTrustCard;
