import { Link } from "react-router-dom";
import { Package, Plus, Eye, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayTitle } from "@/lib/productI18n";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";

const LendingsTab = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();
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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noListings}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noListingsSubtitle}</p>
        <Button asChild>
          <Link to="/owner/new-product">
            <Plus className="mr-2 h-4 w-4" />
            {copy.dashboard.startListing}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">{copy.dashboard.activeProducts}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeProducts.length}</p>
        </div>
      </div>

      {/* My Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">{copy.dashboard.myItems}</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/owner/new-product">
              <Plus className="mr-2 h-4 w-4" />
              {copy.dashboard.addListing}
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
            const approval = (product as any).approval_status as string | undefined;
            const derivedStatus: "pending" | "rejected" | "active" | "inactive" =
              approval === "pending"
                ? "pending"
                : approval === "rejected"
                ? "rejected"
                : product.is_active
                ? "active"
                : "inactive";
            const isPending = derivedStatus === "pending";
            const productUrl = getProductUrl(product);
            return (
              <div key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <img src={product.images?.[0] || "/placeholder.svg"} alt={getDisplayTitle(product, language)} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-foreground truncate">{getDisplayTitle(product, language)}</h4>
                    <StatusBadge status={derivedStatus} size="sm" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-primary">{clientPrice} RON/{copy.common.perDay.replace("/ ", "")}</p>
                  <div className="mt-2 flex gap-2">
                    {isPending ? (
                      <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                        <a href={productUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          {copy.dashboard.previewListing}
                        </a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <Link to={productUrl}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                      <Link to={`/owner/edit-product/${product.id}`}><Edit className="h-4 w-4" /></Link>
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
