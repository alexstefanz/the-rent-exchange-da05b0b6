import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/features/messaging/messagingApi";
import StatusBadge from "./StatusBadge";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Rental {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string;
  owner_id: string | null;
  owner_name: string;
  start_date: string;
  end_date: string;
  subtotal: number;
  status: string;
  location: string;
}

const fetchMyRentals = async (userId: string): Promise<Rental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, product_id, start_date, end_date, subtotal, status, created_at, products(title, images, location_city, owner_id, profiles:owner_id(full_name))")
    .eq("renter_id", userId)
    .in("status", ["confirmed", "active", "completed"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    product_id: r.product_id,
    product_title: r.products?.title || "Produs șters",
    product_image: r.products?.images?.[0] || "/placeholder.svg",
    owner_id: r.products?.owner_id || null,
    owner_name: r.products?.profiles?.full_name || "Utilizator",
    start_date: format(new Date(r.start_date), "dd MMM yyyy"),
    end_date: format(new Date(r.end_date), "dd MMM yyyy"),
    subtotal: r.subtotal,
    status: r.status,
    location: r.products?.location_city || "",
  }));
};

const RentalsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContactOwner = async (rental: Rental) => {
    if (!rental.product_id || !rental.owner_id) return;
    const conv = await getOrCreateConversation(rental.product_id, rental.owner_id);
    if (conv) {
      navigate(`/mesaje?conv=${conv.id}`);
    }
  };

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: !!user?.id,
  });

  const activeRentals = rentals.filter(r => r.status === "confirmed" || r.status === "active");
  const completedRentals = rentals.filter(r => r.status === "completed");

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
    <div className="space-y-8">
      {activeRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{copy.dashboard.upcomingRentals}</h3>
          <div className="space-y-4">
            {activeRentals.map((rental) => (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/produs/${rental.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{rental.product_title}</Link>
                    <StatusBadge status={rental.status as any} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.dashboard.owner}: {rental.owner_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                    {rental.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{rental.location}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold text-primary">{rental.subtotal} RON</span>
                    <Button variant="outline" size="sm" onClick={() => handleContactOwner(rental)}>
                      {copy.dashboard.contactOwner}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{copy.dashboard.rentalHistory}</h3>
          <div className="space-y-4">
            {completedRentals.map((rental) => (
              <div key={rental.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 opacity-75">
                <img src={rental.product_image} alt={rental.product_title} className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{rental.product_title}</span>
                    <StatusBadge status={rental.status as any} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{rental.start_date} - {rental.end_date}</span>
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-muted-foreground">{rental.subtotal} RON</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default RentalsTab;
