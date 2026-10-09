import { Link } from "react-router-dom";
import { useState } from "react";
import { MapPin, Eye, Edit, MoreHorizontal, EyeOff, Eye as EyeIcon, CalendarDays, Trash2, Share2, Sparkles, History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayTitle } from "@/lib/productI18n";
import { calculateClientPrice, type Product } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import ListingStatusBadge, { type ListingStatus } from "./ListingStatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  product: Product;
  status: ListingStatus;
  onHide?: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
  onCalendar?: () => void;
  onHistory?: () => void;
}


const deriveQualityScore = (p: Product): number => {
  let s = 0;
  if ((p.title?.length || 0) >= 20) s += 15;
  if ((p.description?.length || 0) >= 150) s += 20; else if ((p.description?.length || 0) >= 60) s += 10;
  const imgs = p.images?.length || 0;
  if (imgs >= 6) s += 20; else if (imgs >= 3) s += 12; else if (imgs >= 1) s += 5;
  if (p.condition) s += 10;
  if ((p.usage_rules?.length || 0) > 0) s += 5;
  if (p.category && p.subcategory) s += 10;
  if (p.location_city && p.pickup_lat && p.pickup_lng) s += 10;
  if (p.daily_price_owner > 0) s += 5;
  if ((p.included_items?.length || 0) > 0) s += 5;
  return Math.min(100, s);
};

const ListingCard = ({ product, status, onHide, onActivate, onDelete, onCancelDeletion, onCalendar, onHistory }: Props) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const [imgError, setImgError] = useState(false);

  const url = getProductUrl(product);
  const title = getDisplayTitle(product, language);
  const price = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
  const quality = (product.quality_score && product.quality_score > 0) ? product.quality_score : deriveQualityScore(product);
  const qualityColor = quality >= 80 ? "bg-emerald-500" : quality >= 50 ? "bg-amber-500" : "bg-rose-500";

  const cover = !imgError && product.images?.[0] ? product.images[0] : "/placeholder.svg";

  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const editUrl = `/owner/edit-product/${product.id}`;
  // Rejected listings are not publicly visible — direct all "view" actions to the edit page instead.
  const primaryUrl = isRejected ? editUrl : url;
  const linkTarget = isPending ? "_blank" : undefined;
  const linkRel = isPending ? "noopener noreferrer" : undefined;

  const handleShare = async () => {
    const fullUrl = window.location.origin + url;
    if (navigator.share) {
      try { await navigator.share({ title, url: fullUrl }); return; } catch { /* user cancel */ }
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: t("Link copiat", "Link copied") });
    } catch {
      toast({ title: t("Nu s-a putut copia linkul", "Failed to copy link"), variant: "destructive" });
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link to={primaryUrl} target={isRejected ? undefined : linkTarget} rel={isRejected ? undefined : linkRel}>
          <img
            src={cover}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <ListingStatusBadge status={status} />
          {(product as any).pending_edits && (
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
              {t("Modificare în verificare", "Edit under review")}
            </span>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("Mai multe acțiuni", "More actions")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border/50 backdrop-blur hover:bg-background"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link to={primaryUrl} target={isRejected ? undefined : linkTarget}>
                  <Eye className="mr-2 h-4 w-4" />
                  {isRejected ? t("Editează pentru republicare", "Edit to republish") : t("Vezi anunț", "View listing")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={editUrl}><Edit className="mr-2 h-4 w-4" /> {t("Editează", "Edit")}</Link>
              </DropdownMenuItem>
              {onCalendar && !isRejected && (
                <DropdownMenuItem onClick={onCalendar}><CalendarDays className="mr-2 h-4 w-4" /> {t("Disponibilitate", "Availability")}</DropdownMenuItem>
              )}
              {onHistory && (
                <DropdownMenuItem onClick={onHistory}><HistoryIcon className="mr-2 h-4 w-4" /> {t("Istoric", "History")}</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> {t("Distribuie", "Share")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {status === "deletion_pending" ? (
                onCancelDeletion && (
                  <DropdownMenuItem onClick={onCancelDeletion}>
                    <EyeIcon className="mr-2 h-4 w-4" /> {t("Anulează cererea de ștergere", "Cancel deletion request")}
                  </DropdownMenuItem>
                )
              ) : (
                <>
                  {status === "active" || status === "unavailable" ? (
                    onHide && <DropdownMenuItem onClick={onHide}><EyeOff className="mr-2 h-4 w-4" /> {t("Ascunde", "Hide")}</DropdownMenuItem>
                  ) : (
                    onActivate && <DropdownMenuItem onClick={onActivate}><EyeIcon className="mr-2 h-4 w-4" /> {t("Reactivează", "Reactivate")}</DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-rose-600 focus:text-rose-600">
                      <Trash2 className="mr-2 h-4 w-4" /> {t("Șterge", "Delete")}
                    </DropdownMenuItem>
                  )}
                </>
              )}

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={primaryUrl} className="min-w-0 flex-1 hover:text-primary">
            <h3 className="truncate font-semibold text-foreground">{title}</h3>
          </Link>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {product.location_city && (
            <><MapPin className="h-3 w-3" /><span className="truncate">{product.location_city}</span><span>·</span></>
          )}
          {product.category && <span className="truncate">{product.category}</span>}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-lg font-bold text-foreground">{price} <span className="text-sm font-medium text-muted-foreground">RON</span></div>
            <div className="text-[11px] text-muted-foreground">{t("preț afișat / zi", "shown price / day")}</div>
          </div>
        </div>

        {/* Quality score */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> {t("Calitate anunț", "Listing quality")}</span>
            <span className="font-semibold text-foreground">{quality}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full transition-all", qualityColor)} style={{ width: `${quality}%` }} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={editUrl}>
              <Edit className="h-4 w-4" />{" "}
              {isRejected ? t("Editează & retrimite", "Edit & resubmit") : t("Editează", "Edit")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={primaryUrl} target={isRejected ? undefined : linkTarget}><Eye className="h-4 w-4" /></Link>
          </Button>
          {onCalendar && !isRejected && (
            <Button variant="outline" size="sm" onClick={onCalendar} aria-label={t("Calendar", "Calendar")}>
              <CalendarDays className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ListingCard;