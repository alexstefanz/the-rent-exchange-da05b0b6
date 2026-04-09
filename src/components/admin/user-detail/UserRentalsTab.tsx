import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ShoppingCart } from "lucide-react";

interface Props {
  userId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
};

const UserRentalsTab = ({ userId }: Props) => {
  const { data: rentals, isLoading } = useQuery({
    queryKey: ['adminUserRentals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select('id, product_id, renter_id, owner_id, start_date, end_date, rental_days, daily_price, subtotal, platform_fee, owner_payout, status, payment_status, created_at, products(title, images)')
        .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!rentals?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nicio rezervare</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rentals.map((r) => {
        const isRenter = r.renter_id === userId;
        const product = r.products as any;
        return (
          <div key={r.id} className="p-3 rounded-lg border space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {isRenter ? "🛒 Chiriaș" : "📦 Proprietar"}
              </Badge>
              <Badge className={`text-xs ${statusColors[r.status] || ''}`}>{r.status}</Badge>
              <Badge variant="outline" className="text-xs">{r.payment_status}</Badge>
            </div>
            <p className="font-medium text-sm">{product?.title || 'Produs șters'}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(r.start_date), "d MMM", { locale: ro })} – {format(new Date(r.end_date), "d MMM yyyy", { locale: ro })} • {r.rental_days} zile • {r.subtotal} RON
            </p>
            <p className="text-xs text-muted-foreground">
              Comision: {r.platform_fee} RON • Proprietar primește: {r.owner_payout} RON
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default UserRentalsTab;
