import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { differenceInDays, isBefore } from "date-fns";
import { useBookedDates, isDateBooked, hasBookedDateInRange } from "@/hooks/queries/useBookedDates";
import { ChevronRight, MapPin, Heart, Share2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { getProductById, getProductBySlug, Product, calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getOrCreateConversation, sendMessage } from "@/features/messaging/messagingApi";
import { ChatDialog } from "@/components/messaging/ChatDialog";
import NearbyProductsSlider from "@/components/products/NearbyProductsSlider";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import FreeCancellationNotice from "@/components/product/FreeCancellationNotice";
import OwnerOtherListings from "@/components/product/OwnerOtherListings";
import ProductReviewsSection from "@/components/product/ProductReviewsSection";
import PremiumBookingCard from "@/components/product/PremiumBookingCard";
import MobileStickyBookingBar from "@/components/product/MobileStickyBookingBar";
import OwnerTrustCard from "@/components/product/OwnerTrustCard";
import QuickQuestionsChips from "@/components/product/QuickQuestionsChips";
import ProductInfoAccordion from "@/components/product/ProductInfoAccordion";
import RentalProtection from "@/components/product/RentalProtection";
import HowItWorksMini from "@/components/product/HowItWorksMini";
import SocialProofStrip from "@/components/product/SocialProofStrip";
import LocationCard from "@/components/product/LocationCard";
import ReviewSummaryCard from "@/components/product/ReviewSummaryCard";
import StickyProductHeader from "@/components/product/StickyProductHeader";
import PremiumLightbox from "@/components/product/PremiumLightbox";
import ProductDetailSkeleton from "@/components/product/ProductDetailSkeleton";
import RecentlyViewedSlider from "@/components/product/RecentlyViewedSlider";
import ShareDialog from "@/components/product/ShareDialog";
import { trackRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductExtendedStats } from "@/hooks/queries/useProductExtendedStats";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";

interface OwnerInfo { id: string; full_name: string | null; avatar_url: string | null; }

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const copy = useUxCopy();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const titleBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const productData = isUuid ? await getProductById(slug) : await getProductBySlug(slug);
        if (productData) {
          setProduct(productData);
          if (isUuid && productData.slug) { navigate(getProductUrl(productData), { replace: true }); return; }
          const { data: ownerData } = await supabase.rpc('get_product_owner_public_info', { owner_uuid: productData.owner_id });
          if (ownerData && ownerData.length > 0) setOwner(ownerData[0]);
          if (user) { setIsFavorite(await isProductFavorite(productData.id)); }
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchProduct();
  }, [slug, user]);

  const { bookedDates } = useBookedDates(product?.id);
  const { data: extendedStats } = useProductExtendedStats(product?.id);

  const ensureConversation = async () => {
    if (!user) {
      toast({ title: copy.productDetail.authRequired, description: copy.productDetail.authRequiredDesc, variant: "destructive" });
      navigate('/auth', { replace: true });
      return null;
    }
    if (!product || user.id === product.owner_id) {
      toast({ title: copy.productDetail.cantContact, description: copy.productDetail.cantContactDesc, variant: "destructive" });
      return null;
    }
    const conv = await getOrCreateConversation(product.id, product.owner_id);
    if (!conv) {
      toast({ title: copy.auth.errorGeneric, description: copy.productDetail.conversationError, variant: "destructive" });
      return null;
    }
    setConversationId(conv.id);
    return conv;
  };

  const handleStartChat = async () => {
    const conv = await ensureConversation();
    if (conv) setChatOpen(true);
  };

  const handleQuickQuestion = async (message: string) => {
    const conv = await ensureConversation();
    if (!conv) return;
    await sendMessage(conv.id, message);
    setChatOpen(true);
  };

  const category = product?.category ? categories.find(c => c.name === product.category) : null;
  const subcategory = product?.subcategory && category ? category.subcategories.find(s => s.id === product.subcategory) : null;
  const clientPrice = product ? calculateClientPrice(product.daily_price_owner, product.platform_fee_percent) : 0;
  const priceWeek = Math.round(clientPrice * 6);
  const priceMonth = Math.round(clientPrice * 22);
  const images = product?.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || isDateBooked(date, bookedDates)) return;
    if (!startDate || (startDate && endDate)) { setStartDate(date); setEndDate(undefined); }
    else if (isBefore(date, startDate)) { setStartDate(date); }
    else {
      if (differenceInDays(date, startDate) < 1) {
        toast({ title: t("Perioadă prea scurtă", "Period too short"), description: t("Produsul se închiriază minim 2 zile.", "Min 2 days."), variant: "destructive" });
        return;
      }
      if (hasBookedDateInRange(startDate, date, bookedDates)) {
        toast({ title: t("Perioadă indisponibilă", "Period unavailable"), description: t("Există zile rezervate în interval.", "Booked days in range."), variant: "destructive" });
        return;
      }
      setEndDate(date);
    }
  };
  const clearDates = () => { setStartDate(undefined); setEndDate(undefined); };
  const rentalDays = useMemo(() => (startDate && endDate) ? differenceInDays(endDate, startDate) + 1 : 0, [startDate, endDate]);

  // SEO (must run before early returns to keep hook order stable)
  const seoLocation = product?.location_city || "România";
  const seoTitle = product ? `${(language === "en" && product.title_en) ? product.title_en : product.title} - ${seoLocation} | Rentli` : "Rentli";
  const seoDisplayTitle = product ? ((language === "en" && product.title_en) ? product.title_en : product.title) : "";
  const seoDisplayDesc = product ? ((language === "en" && product.description_en) ? product.description_en : product.description) : "";
  const rawDesc = (seoDisplayDesc || "").replace(/\s+/g, " ").trim();
  const seoDesc = rawDesc.length > 0
    ? (rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc)
    : t(`Închiriază pe Rentli. Plată securizată, predare cu poze, suport 7/7.`, `Rent on Rentli. Secure payment, photo handover, 7/7 support.`);
  const seoFirstImage = images[0];
  const seoImage = seoFirstImage?.startsWith("http") ? seoFirstImage : `${typeof window !== "undefined" ? window.location.origin : ""}${seoFirstImage}`;
  const canonicalUrl = product ? `${typeof window !== "undefined" ? window.location.origin : ""}${getProductUrl(product)}` : (typeof window !== "undefined" ? window.location.href : "");
  useSEO({
    title: seoTitle,
    description: seoDesc,
    image: seoImage,
    url: canonicalUrl,
    canonical: canonicalUrl,
    type: "product",
    jsonLd: product ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: seoDisplayTitle,
      description: seoDesc,
      image: images.filter(i => i && i !== "/placeholder.svg").map(i => i.startsWith("http") ? i : `${window.location.origin}${i}`),
      brand: { "@type": "Brand", name: "Rentli" },
      category: product.category || undefined,
      offers: {
        "@type": "Offer",
        price: clientPrice,
        priceCurrency: "RON",
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
        seller: { "@type": "Person", name: owner?.full_name || "Rentli" },
      },
      ...(extendedStats?.owner_avg_rating && extendedStats.owner_review_count ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(extendedStats.owner_avg_rating).toFixed(1),
          reviewCount: extendedStats.owner_review_count,
        },
      } : {}),
    } : null,
  });

  const handleReserve = () => {
    if (!product || !startDate || !endDate) return;
    navigate('/checkout', { state: { product: { id: product.id, title: displayTitle, images, price: clientPrice, priceUnit: "zi", location, ownerId: product.owner_id, platformFeePercent: product.platform_fee_percent }, startDate, endDate, rentalDays, totalPrice: 0 } });
  };

  const handleShare = () => setShareOpen(true);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({ title: copy.favorites?.loginRequired || "Login required", variant: "destructive" });
      navigate('/auth', { replace: true });
      return;
    }
    if (!product) return;
    try {
      if (isFavorite) { await removeFavoriteProduct(product.id); setIsFavorite(false); toast({ title: copy.favorites?.removed || "Removed" }); }
      else { await addFavoriteProduct(product.id); setIsFavorite(true); toast({ title: copy.favorites?.added || "Added" }); }
    } catch { toast({ title: copy.auth?.errorGeneric || "Error", variant: "destructive" }); }
  };

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return (<div className="min-h-screen bg-background"><Navbar /><main className="container py-16 text-center"><h1 className="font-heading text-2xl font-bold text-foreground">{copy.product.notFound}</h1><Button asChild className="mt-4"><Link to="/categorii">{copy.product.backToCategories}</Link></Button></main><Footer /></div>);

  const location = product.location_city || "România";
  const ownerName = owner?.full_name || copy.dashboard.owner;
  const displayTitle = (language === "en" && product.title_en) ? product.title_en : product.title;
  const displayDescription = (language === "en" && product.description_en) ? product.description_en : product.description;
  const isOwnProduct = user?.id === product.owner_id;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Navbar />

      <StickyProductHeader
        title={displayTitle}
        clientPrice={clientPrice}
        rating={extendedStats?.owner_avg_rating}
        reviewCount={extendedStats?.owner_review_count}
        triggerRef={titleBlockRef}
        onReserve={handleReserve}
        isOwnProduct={isOwnProduct}
      />

      <ProductImageGallery
        variant="mobile"
        images={images}
        title={displayTitle}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onBack={() => navigate(-1)}
        onOpenLightbox={openLightbox}
      />
      <div className="lg:hidden px-[10px] mt-3">
        <FreeCancellationNotice />
      </div>

      <main className="w-full max-w-7xl mx-auto py-6 px-[10px] md:px-6 lg:px-8">
        <nav className="mb-4 hidden md:flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          <Link to="/categorii" className="hover:text-primary text-xs whitespace-nowrap">{copy.product.allCategories}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {category && (<><Link to={`/categorie/${category.slug}`} className="hover:text-primary text-xs whitespace-nowrap">{language === "en" ? category.nameEn : category.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          {subcategory && (<><Link to={`/subcategorie/${subcategory.id}`} className="hover:text-primary whitespace-nowrap">{language === "en" ? subcategory.nameEn : subcategory.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          <span className="text-foreground whitespace-nowrap">{displayTitle}</span>
        </nav>

        {/* Title block desktop */}
        <div ref={titleBlockRef} className="hidden lg:flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-semibold text-foreground">{displayTitle}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{location}</span>
              <SocialProofStrip
                timesRented={extendedStats?.times_rented}
                watchersCount={extendedStats?.watchers_count}
                lastBookingAt={extendedStats?.last_booking_at}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="h-10 w-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors" aria-label="share">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={handleToggleFavorite} className="h-10 w-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-all hover:scale-105" aria-label="favorite">
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5 order-2 lg:order-1">
            <ProductImageGallery
              variant="desktop"
              images={images}
              title={displayTitle}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onOpenLightbox={openLightbox}
            />

            <div className="lg:hidden">
              <h1 className="font-heading text-2xl font-semibold text-foreground">{displayTitle}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 text-primary" />{location}
              </div>
              <div className="mt-3">
                <SocialProofStrip
                  timesRented={extendedStats?.times_rented}
                  watchersCount={extendedStats?.watchers_count}
                  lastBookingAt={extendedStats?.last_booking_at}
                />
              </div>
            </div>

            <FreeCancellationNotice />

            <OwnerTrustCard
              ownerId={product.owner_id}
              ownerName={ownerName}
              ownerAvatar={owner?.avatar_url}
              isOwnProduct={isOwnProduct}
              onStartChat={handleStartChat}
              stats={extendedStats}
            />

            {!isOwnProduct && <QuickQuestionsChips onAsk={handleQuickQuestion} />}

            <ProductInfoAccordion
              description={displayDescription}
              includedItems={(product as any).included_items}
            />

            <RentalProtection />

            <HowItWorksMini />

            <LocationCard address={product.pickup_address || location} city={product.location_city} />

            <ReviewSummaryCard productId={product.id} />

            <ProductReviewsSection productId={product.id} isOwnProduct={isOwnProduct} />
          </div>

          {/* Sidebar */}
          <div className="order-1 lg:order-2 lg:self-stretch hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <PremiumBookingCard
                clientPrice={clientPrice}
                priceWeek={priceWeek}
                priceMonth={priceMonth}
                startDate={startDate}
                endDate={endDate}
                bookedDates={bookedDates}
                onSelectDate={handleDateSelect}
                onClear={clearDates}
                onReserve={handleReserve}
                onAsk={handleStartChat}
                isOwnProduct={isOwnProduct}
                responseMinutes={extendedStats?.owner_response_minutes}
                ownerVerified
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <OwnerOtherListings ownerId={product.owner_id} currentProductId={product.id} ownerName={ownerName} />
        </div>

        <div className="mt-8">
          <NearbyProductsSlider currentProductId={product.id} locationCity={product.location_city} category={product.category} />
        </div>
      </main>

      <Footer />

      {/* Mobile sticky booking bar */}
      <MobileStickyBookingBar
        clientPrice={clientPrice}
        priceWeek={priceWeek}
        priceMonth={priceMonth}
        startDate={startDate}
        endDate={endDate}
        bookedDates={bookedDates}
        onSelectDate={handleDateSelect}
        onClear={clearDates}
        onReserve={handleReserve}
        onAsk={handleStartChat}
        isOwnProduct={isOwnProduct}
        responseMinutes={extendedStats?.owner_response_minutes}
        ownerVerified
      />

      {conversationId && (
        <ChatDialog open={chatOpen} onOpenChange={setChatOpen} conversationId={conversationId} otherUserName={owner?.full_name || null} otherUserAvatar={owner?.avatar_url || null} productTitle={product?.title || 'Produs'} />
      )}

      <PremiumLightbox
        open={lightboxOpen}
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        title={displayTitle}
      />
    </div>
  );
};

export default ProductDetail;
