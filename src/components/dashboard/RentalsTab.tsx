import { Link } from "react-router-dom";
import { Calendar, MapPin, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { uxCopy } from "@/data/uxCopy";

interface Rental {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  location: string;
}

interface RentalsTabProps {
  rentals?: Rental[];
  isLoading?: boolean;
}

// Mock data for demonstration
const mockRentals: Rental[] = [
  {
    id: "1",
    productId: "prod-1",
    productTitle: "Canon EOS R5 - Cameră Mirrorless",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80",
    ownerName: "Alexandru M.",
    startDate: "15 Feb 2026",
    endDate: "18 Feb 2026",
    totalPrice: 450,
    status: "pending",
    location: "București",
  },
  {
    id: "2",
    productId: "prod-2",
    productTitle: "DJI Mavic 3 Pro - Dronă Profesională",
    productImage: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&q=80",
    ownerName: "Maria I.",
    startDate: "10 Feb 2026",
    endDate: "12 Feb 2026",
    totalPrice: 350,
    status: "accepted",
    location: "Cluj-Napoca",
  },
];

const RentalsTab = ({ rentals = mockRentals, isLoading = false }: RentalsTabProps) => {
  const upcomingRentals = rentals.filter(r => r.status === "pending" || r.status === "accepted");
  const pastRentals = rentals.filter(r => r.status === "completed" || r.status === "cancelled");

  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">
          {uxCopy.dashboard.noRentals}
        </h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          {uxCopy.dashboard.noRentalsSubtitle}
        </p>
        <Button asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {uxCopy.dashboard.startSearching}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Rentals */}
      {upcomingRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
            {uxCopy.dashboard.upcomingRentals}
          </h3>
          <div className="space-y-4">
            {upcomingRentals.map((rental) => (
              <div
                key={rental.id}
                className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <img
                  src={rental.productImage}
                  alt={rental.productTitle}
                  className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/produs/${rental.productId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {rental.productTitle}
                    </Link>
                    <StatusBadge status={rental.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Proprietar: {rental.ownerName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {rental.startDate} - {rental.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {rental.location}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold text-primary">{rental.totalPrice} RON</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profil#mesaje`}>
                        Contactează proprietarul
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past Rentals */}
      {pastRentals.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
            {uxCopy.dashboard.rentalHistory}
          </h3>
          <div className="space-y-4">
            {pastRentals.map((rental) => (
              <div
                key={rental.id}
                className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 opacity-75"
              >
                <img
                  src={rental.productImage}
                  alt={rental.productTitle}
                  className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {rental.productTitle}
                    </span>
                    <StatusBadge status={rental.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {rental.startDate} - {rental.endDate}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-muted-foreground">{rental.totalPrice} RON</span>
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
