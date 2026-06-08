import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ShieldCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductExtendedStats } from "@/hooks/queries/useProductExtendedStats";

interface Props {
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string | null;
  isOwnProduct?: boolean;
  onStartChat?: () => void;
  stats?: ProductExtendedStats;
  isLoading?: boolean;
}

const OwnerTrustCard = ({ ownerId, ownerName, ownerAvatar, stats }: Props) => {
  const { t } = useLanguage();

  const memberSince = stats?.owner_member_since ? new Date(stats.owner_member_since).getFullYear().toString() : "—";
  const rating = stats?.owner_avg_rating ? Number(stats.owner_avg_rating).toFixed(1) : "—";
  const reviewCount = stats?.owner_review_count || 0;

  return (
    <Link
      to={`/utilizator/${ownerId}`}
      className="group block rounded-2xl border border-border bg-card p-5 md:p-6 transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={t(`Vezi profilul lui ${ownerName}`, `View ${ownerName}'s profile`)}
    >
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
            <p className="font-heading text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">{ownerName}</p>
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
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 self-center" />
      </div>
    </Link>
  );
};

export default OwnerTrustCard;
