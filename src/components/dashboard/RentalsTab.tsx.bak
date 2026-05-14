import { Link } from "react-router-dom";
import { Calendar, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import RentalProductCard from "./RentalProductCard";

interface Rental {
  id: string;
  public_id: string | null;
  product_id: string | null;
  product_title: string;
  product_image: string;
  start_date_raw: string;
  end_date_raw: string;
  subtotal: number;
  status: string;
}

const fetchMyRentals = async (userId: string): Promise<Rental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, public_id, product_id, start_date, end_date, subtotal, status, payment_status, created_at, products(title, images)")
    .eq("renter_id", userId)
    .or("status.in.(confirmed,active,completed),and(status.eq.pending,payment_status.in.(authorized,paid))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    public_id: r.public_id,
    product_id: r.product_id,
    product_title: r.products?.title || "Produs șters",
    product_image: r.products?.images?.[0] || "/placeholder.svg",
    start_date_raw: r.start_date,
    end_date_raw: r.end_date,
    subtotal: r.subtotal,
    status: r.status,
  }));
};

const RentalsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();

  useRentalRealtime(user?.id, "renter", [["my-rentals", user?.id]]);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noRentals}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noRentalsSubtitle}</p>
        <Button asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {copy.dashboard.startSearching}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {rentals.map((rental) => {
        const to = rental.public_id ? `/rezervari/${rental.public_id}` : `/produs/${rental.product_id}`;
        return (
          <RentalProductCard
            key={rental.id}
            to={to}
            image={rental.product_image}
            title={rental.product_title}
            startDate={format(new Date(rental.start_date_raw), "d MMM", { locale: roLocale })}
            endDate={format(new Date(rental.end_date_raw), "d MMM", { locale: roLocale })}
            status={rental.status}
            amount={rental.subtotal}
            amountLabel="Total"
          />
        );
      })}
    </div>
  );
};

export default RentalsTab;
