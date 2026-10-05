import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Heart, Share2 } from "lucide-react";
import { differenceInDays, isBefore } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreviewBanner from "@/components/product/PreviewBanner";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import PremiumBookingCard from "@/components/product/PremiumBookingCard";
import MobileStickyBookingBar from "@/components/product/MobileStickyBookingBar";
import OwnerTrustCard from "@/components/product/OwnerTrustCard";
import ProductInfoAccordion from "@/components/product/ProductInfoAccordion";
import LocationCard from "@/components/product/LocationCard";
import SocialProofStrip from "@/components/product/SocialProofStrip";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { calculateClientPrice, type Product } from "@/features/products/productsApi";
import type { PublishFormData } from "@/lib/publishTypes";
import { toast } from "@/hooks/use-toast";

interface PreviewPayload {
  data: PublishFormData;
  feePercent: number;
  ownerId: string;
  savedAt: number;
}

const STORAGE_KEY = "publish:preview";

const buildSyntheticProduct = (payload: PreviewPayload): Product => {
  const { data, feePercent, ownerId } = payload;
  return {
    id: "preview",
    owner_id: ownerId,
    title: data.title || "—",
    slug: null,
    description: data.description || null,
    title_en: null,
    description_en: null,
    daily_price_owner: data.daily_price_owner ?? 0,
    platform_fee_percent: feePercent,
    category: data.category || null,
    subcategory: data.subcategory || null,
    location_city: data.location_city || null,
    location_country: "Romania",
    pickup_address: data.pickup_address || null,
    images: data.images || [],
    included_items: data.included_items || [],
    is_active: true,
    approval_status: "preview",
    created_at: new Date().toISOString(),
    condition: data.condition || null,
    deposit_type: data.deposit_type || null,
    deposit_value: data.deposit_value ?? null,
    min_rental_days: data.min_rental_days ?? 1,
    min_rental_preset: data.min_rental_preset || null,
    max_rental_days: data.max_rental_days ?? null,
    delivery_available: data.delivery_available ?? false,
    delivery_fee: data.delivery_fee ?? null,
    delivery_radius_km: data.delivery_radius_km ?? null,
    pickup_available: data.pickup_available ?? true,
    pickup_lat: data.pickup_lat ?? null,
    pickup_lng: data.pickup_lng ?? null,
    usage_rules: data.usage_rules || [],
    available_immediately: data.available_immediately ?? true,
    blocked_dates: data.blocked_dates || [],
    quality_score: null,
    available_from: null,
  };
};

const ProductPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useSEO({
    title: t("Previzualizare anunț | Rentli", "Listing preview | Rentli"),
    description: t("Pagină internă de previzualizare a anunțului.", "Internal listing preview page."),
    noindex: true,
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        navigate("/anunturi", { replace: true });
        return;
      }
      const parsed = JSON.parse(raw) as PreviewPayload;
      setPayload(parsed);
    } catch {
      navigate("/anunturi", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!payload?.ownerId) return;
    supabase
      .rpc("get_product_owner_public_info", { owner_uuid: payload.ownerId })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setOwnerName(res.data[0].full_name || "");
          setOwnerAvatar(res.data[0].avatar_url || null);
        }
      });
  }, [payload?.ownerId]);

  const product = useMemo(() => (payload ? buildSyntheticProduct(payload) : null), [payload]);

  const previewBlocked = () => {
    toast({
      title: t("Disponibil după publicare", "Available after publishing"),
      description: t(
        "Aceasta este doar o previzualizare. Acțiunea va funcționa după ce publici anunțul.",
        "This is just a preview. The action will work once you publish the listing.",
      ),
    });
  };

  if (!product || !payload) {
    return (
      <div className="min-h-screen bg-background">
        <PreviewBanner />
        <Navbar />
        <main className="container py-16 text-center text-muted-foreground">
          {t("Se încarcă previzualizarea…", "Loading preview…")}
        </main>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
  const priceWeek = Math.round(clientPrice * 6);
  const priceMonth = Math.round(clientPrice * 22);
  const location = product.location_city || "România";
  const displayTitle = product.title;
  const rentalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!startDate || !endDate || startDate.getTime() !== endDate.getTime()) {
      setStartDate(date);
      setEndDate(date);
      return;
    }
    if (date.getTime() === startDate.getTime()) return;
    if (isBefore(date, startDate)) setStartDate(date);
    else setEndDate(date);
  };

  const resolvedOwnerName =
    ownerName ||
    (user?.user_metadata as any)?.full_name ||
    user?.email ||
    t("Tu", "You");

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <PreviewBanner />
      <Navbar />

      <ProductImageGallery
        variant="mobile"
        images={images}
        title={displayTitle}
        isFavorite={false}
        onToggleFavorite={previewBlocked}
        onShare={previewBlocked}
        onBack={() => window.history.length > 1 ? window.history.back() : window.close()}
        onOpenLightbox={() => {}}
      />

      <main className="w-full max-w-7xl mx-auto py-6 px-[10px] md:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-5 lg:mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl lg:text-3xl font-semibold text-foreground">{displayTitle}</h1>
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 mt-1 lg:mt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                {location}
              </span>
              <div className="hidden lg:block"><SocialProofStrip /></div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={previewBlocked}
              className="h-10 w-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={previewBlocked}
              className="h-10 w-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-all"
              aria-label="favorite"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5 order-2 lg:order-1">
            <ProductImageGallery
              variant="desktop"
              images={images}
              title={displayTitle}
              isFavorite={false}
              onToggleFavorite={previewBlocked}
              onOpenLightbox={() => {}}
            />

            <OwnerTrustCard
              ownerId={product.owner_id}
              ownerName={resolvedOwnerName}
              ownerAvatar={ownerAvatar}
              isOwnProduct
            />

            <ProductInfoAccordion
              description={product.description}
              includedItems={product.included_items || undefined}
              usageRules={product.usage_rules || undefined}
            />

            <LocationCard
              address={product.pickup_address || location}
              city={product.location_city}
            />
          </div>

          <div className="order-1 lg:order-2 lg:self-stretch">
            <div className="lg:sticky lg:top-24">
              <PremiumBookingCard
                clientPrice={clientPrice}
                ownerPrice={Number(product.daily_price_owner) || 0}
                priceWeek={priceWeek}
                priceMonth={priceMonth}
                startDate={startDate}
                endDate={endDate}
                bookedDates={[]}
                onSelectDate={handleDateSelect}
                onClear={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                onReserve={previewBlocked}
                onAsk={previewBlocked}
                isOwnProduct
                minRentalDays={product.min_rental_days}
                maxRentalDays={product.max_rental_days ?? null}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <MobileStickyBookingBar
        clientPrice={clientPrice}
                ownerPrice={Number(product.daily_price_owner) || 0}
        priceWeek={priceWeek}
        priceMonth={priceMonth}
        startDate={startDate}
        endDate={endDate}
        bookedDates={[]}
        onSelectDate={handleDateSelect}
        onClear={() => {
          setStartDate(undefined);
          setEndDate(undefined);
        }}
        onReserve={previewBlocked}
        onAsk={previewBlocked}
        isOwnProduct
        minRentalDays={product.min_rental_days}
        maxRentalDays={product.max_rental_days ?? null}
      />
    </div>
  );
};

export default ProductPreview;