import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Package } from "lucide-react";

interface Props {
  userId: string;
}

const UserProductsTab = ({ userId }: Props) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['adminUserProducts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, category, subcategory, daily_price_owner, is_active, approval_status, created_at, slug, images, platform_fee_percent')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!products?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Niciun produs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <Link
          key={p.id}
          to={`/admin/products`}
          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          {p.images?.[0] ? (
            <img src={p.images[0]} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {p.category} {p.subcategory ? `› ${p.subcategory}` : ''} • {p.daily_price_owner} RON/zi • Comision: {p.platform_fee_percent}%
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">
              {p.is_active ? "Activ" : "Inactiv"}
            </Badge>
            {p.approval_status === 'pending' && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">În așteptare</Badge>
            )}
            {p.approval_status === 'rejected' && (
              <Badge variant="destructive" className="text-xs">Respins</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {p.created_at ? format(new Date(p.created_at), "d MMM yy", { locale: ro }) : '-'}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default UserProductsTab;
