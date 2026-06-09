import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ArrowRight, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { getOwnerRentals, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type { Product } from "@/features/products/productsApi";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALLOWED_STATUS = ["pending", "accepted", "rejected", "completed", "cancelled", "active", "inactive"];

const ListingHistoryDialog = ({ product, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (r: string, e: string) => (language === "ro" ? r : e);
  const locale = language === "ro" ? ro : enUS;

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["ownerRentals", user?.id],
    queryFn: () => getOwnerRentals(user!.id),
    enabled: !!user?.id && open,
  });

  const productRentals = useMemo(() => {
    if (!product?.id) return [] as OwnerRental[];
    return rentals
      .filter((r) => r.product_id === product.id)
      .sort(
        (a, b) =>
          new Date(b.created_at || b.start_date).getTime() -
          new Date(a.created_at || a.start_date).getTime(),
      );
  }, [rentals, product?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t("Istoric închirieri", "Rental history")}
            <span className="ml-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {productRentals.length}
            </span>
          </DialogTitle>
          {product && (
            <DialogDescription className="truncate">{product.title}</DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : productRentals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-40" />
              {t("Nicio închiriere înregistrată pe acest anunț.", "No rentals recorded for this listing yet.")}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {productRentals.map((rental) => {
                const to = rental.public_id
                  ? `/rezervari/${rental.public_id}`
                  : `/produs/${rental.product_id}`;
                const statusKey = (ALLOWED_STATUS.includes(rental.status) ? rental.status : "pending") as any;
                return (
                  <div
                    key={rental.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-foreground truncate">{rental.product_title}</p>
                        {rental.public_id && (
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 flex-shrink-0">
                            {rental.public_id}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {t("Chiriaș", "Renter")}:{" "}
                        <span className="text-foreground">
                          {rental.renter_name || t("Necunoscut", "Unknown")}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rental.start_date), "d MMM yyyy", { locale })} –{" "}
                        {format(new Date(rental.end_date), "d MMM yyyy", { locale })} · {rental.rental_days}{" "}
                        {t("zile", "days")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {rental.owner_payout} RON
                        </p>
                        <StatusBadge status={statusKey} />
                      </div>
                      <Button asChild variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        <Link to={to}>
                          {t("Vezi mai mult", "View more")}{" "}
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingHistoryDialog;