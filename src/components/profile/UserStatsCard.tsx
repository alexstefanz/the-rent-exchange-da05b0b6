import { Calendar, Package, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface UserStatsCardProps {
  productsCount: number;
  memberSince: string | null;
  averageRating: number;
  reviewsCount: number;
}

const UserStatsCard = ({
  productsCount,
  memberSince,
  averageRating,
  reviewsCount
}: UserStatsCardProps) => {
  const formatMemberSince = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMMM yyyy", { locale: ro });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Products Count */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{productsCount}</p>
          <p className="text-xs text-muted-foreground">Anunțuri active</p>
        </div>
      </div>

      {/* Member Since */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-full">
          <Calendar className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatMemberSince(memberSince)}
          </p>
          <p className="text-xs text-muted-foreground">Membru din</p>
        </div>
      </div>

      {/* Average Rating */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 rounded-full">
          <Star className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {averageRating > 0 ? averageRating.toFixed(1) : "-"}
          </p>
          <p className="text-xs text-muted-foreground">
            {reviewsCount > 0 ? `${reviewsCount} recenzii` : "Fără recenzii"}
          </p>
        </div>
      </div>

      {/* Response Time (Placeholder) */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/10 rounded-full">
          <Clock className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">În curând</p>
          <p className="text-xs text-muted-foreground">Timp răspuns</p>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard;
