import { Link } from "react-router-dom";
import { Package, Plus, Eye, Edit, Check, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { calculateClientPrice } from "@/features/products/productsApi";
import { Loader2 } from "lucide-react";

interface RentalRequest {
  id: string;
  renterName: string;
  renterAvatar: string;
  productTitle: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  message?: string;
}

interface LendingsTabProps {
  requests?: RentalRequest[];
}

const mockRequests: RentalRequest[] = [
  { id: "req-1", renterName: "Ion Popescu", renterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", productTitle: "Canon EOS R5", startDate: "20 Feb 2026", endDate: "23 Feb 2026", totalPrice: 450, message: "Bună! Aș dori să închiriez camera pentru un eveniment de familie." },
];

const LendingsTab = ({ requests = mockRequests }: LendingsTabProps) => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const { data: products = [], isLoading } = useMyProducts(user?.id);

  const activeProducts = products.filter(p => p.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0 && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noListings}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noListingsSubtitle}</p>
        <Button asChild>
          <Link to="/adauga-anunt">
            <Plus className="mr-2 h-4 w-4" />
            {copy.dashboard.startListing}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">{copy.dashboard.activeProducts}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeProducts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{copy.dashboard.pendingRequestsLabel}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{requests.length}</p>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            {copy.dashboard.pendingRequests}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{requests.length}</span>
          </h3>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <img src={request.renterAvatar} alt={request.renterName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{request.renterName}</span>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {copy.dashboard.wantsToRent}: <span className="font-medium">{request.productTitle}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.startDate} - {request.endDate} • <span className="font-semibold text-primary">{request.totalPrice} RON</span>
                    </p>
                    {request.message && (
                      <p className="mt-2 text-sm text-muted-foreground italic bg-background rounded-lg p-2">"{request.message}"</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="gap-1"><Check className="h-4 w-4" />{copy.dashboard.accept}</Button>
                      <Button variant="outline" size="sm" className="gap-1"><X className="h-4 w-4" />{copy.dashboard.reject}</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">{copy.dashboard.myItems}</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/adauga-anunt">
              <Plus className="mr-2 h-4 w-4" />
              {copy.dashboard.addListing}
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
            return (
              <div key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <img src={product.images?.[0] || "/placeholder.svg"} alt={product.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-foreground truncate">{product.title}</h4>
                    <StatusBadge status={product.is_active ? "active" : "inactive"} size="sm" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-primary">{clientPrice} RON/{copy.common.perDay.replace("/ ", "")}</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                      <Link to={`/produs/${product.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                      <Link to={`/editeaza/${product.id}`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LendingsTab;
