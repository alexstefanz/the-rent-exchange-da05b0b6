import { MapPin, Star, Zap, Truck, Shield } from "lucide-react";
import type { PublishFormData } from "@/lib/publishTypes";
import { CONDITION_LABELS } from "@/lib/publishTypes";
import { calculateClientPrice } from "@/features/products/productsApi";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: PublishFormData;
  feePercent: number;
}

const LivePreviewCard = ({ data, feePercent }: Props) => {
  const cover = data.images[0];
  const price = data.daily_price_owner ?? 0;
  const clientPrice = price > 0 ? calculateClientPrice(price, feePercent) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={data.title || "Anunț"}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Cover-ul anunțului
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {data.available_immediately && (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Zap className="h-3 w-3" /> Imediat
            </Badge>
          )}
          {data.condition && (
            <Badge variant="secondary" className="bg-background/90 text-foreground">
              {CONDITION_LABELS[data.condition].ro}
            </Badge>
          )}
        </div>
        {data.delivery_available && (
          <Badge variant="secondary" className="absolute right-3 top-3 gap-1 bg-background/90 text-foreground">
            <Truck className="h-3 w-3" /> Livrare
          </Badge>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">
            {data.title || "Titlul anunțului tău"}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>Nou</span>
          </div>
        </div>

        {data.category && (
          <p className="text-xs text-muted-foreground">
            {data.category}
            {data.subcategory && ` · ${data.subcategory}`}
          </p>
        )}

        {data.location_city && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {data.location_city}
          </div>
        )}

        <div className="flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-lg font-bold text-foreground">
              {clientPrice > 0 ? `${clientPrice} RON` : "—"}
              <span className="text-xs font-normal text-muted-foreground"> / zi</span>
            </p>
            {data.deposit_type === "fixed" && data.deposit_value ? (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3" /> Garanție {data.deposit_value} RON
              </p>
            ) : data.deposit_type === "percent" && data.deposit_value ? (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3" /> Garanție {data.deposit_value}%
              </p>
            ) : null}
          </div>
          {(data.min_rental_days > 1 || data.max_rental_days != null) && (
            <p className="text-[11px] text-muted-foreground">
              {data.max_rental_days != null
                ? `${data.min_rental_days || 1}–${data.max_rental_days} zile`
                : `min. ${data.min_rental_days} zile`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePreviewCard;