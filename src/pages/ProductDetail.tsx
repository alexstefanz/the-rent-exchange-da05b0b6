import { CONDITION_LABELS, type ProductCondition } from "@/lib/publishTypes";
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import OwnerProductActions from "@/components/products/OwnerProductActions";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInDays, isBefore } from "date-fns";
import { useBookedDates, isDateBooked, hasBookedDateInRange } from "@/hooks/queries/useBookedDates";
import { computeRentalPrice } from "@/lib/rentalPricing";
import { hasConsent, purgeIfNoConsent } from "@/lib/consent";
import { ChevronRight, MapPin, Heart, Share2, AlertTriangle, Clock, Edit } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { getProductLookup, Product, calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getOrCreateConversation, sendMessage } from "@/features/messaging/messagingApi";

import ProductImageGallery from "@/components/product/ProductImageGallery";
import PremiumBookingCard from "@/components/product/PremiumBookingCard";
import MobileStickyBookingBar from "@/components/product/MobileStickyBookingBar";
import OwnerTrustCard from "@/components/product/OwnerTrustCard";
import ProductInfoAccordion from "@/components/product/ProductInfoAccordion";
import SocialProofStrip from "@/components/product/SocialProofStrip";
import LocationCard from "@/components/product/LocationCard";
import StickyProductHeader from "@/components/product/StickyProductHeader";
import ProductDetailSkeleton from "@/components/product/ProductDetailSkeleton";
import BookedDatesAlert from "@/components/product/BookedDatesAlert";
import DeletedProductNotice from "@/components/product/DeletedProductNotice";
import PreviewBanner from "@/components/product/PreviewBanner";
import MobileFixedBackButton from "@/components/shared/MobileFixedBackButton";

// Below-the-fold / interaction-triggered → lazy-loaded to shrink the initial bundle.
const NearbyProductsSlider = lazy(() => import("@/components/products/NearbyProductsSlider"));
const OwnerOtherListings = lazy(() => import("@/components/product/OwnerOtherListings"));
const ProductReviewsSection = lazy(() => import("@/components/product/ProductReviewsSection"));
const RecentlyViewedSlider = lazy(() => import("@/components/product/RecentlyViewedSlider"));
const PremiumLightbox = lazy(() => import("@/components/product/PremiumLightbox"));
const ShareDialog = lazy(() => import("@/components/product/ShareDialog"));
import { trackRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductExtendedStats } from "@/hooks/queries/useProductExtendedStats";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { CANONICAL_ORIGIN } from "@/hooks/usePageSeo";
import { truncateForMeta, buildMeta, cleanUserDescription, META_TITLE_MAX, META_DESCRIPTION_MAX } from "@/lib/seoText";

import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";

interface OwnerInfo { id: string; full_name: string | null; avatar_url: string | null; }

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const { user } = useAuth();
  const copy = useUxCopy();
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [conflictDates, setConflictDates] = useState<Date[]>([]);
  const [conflictOpen, setConflictOpen] = useState(false);
  const titleBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      setIsDeleted(false);
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const lookup = await getProductLookup(slug);
        if (lookup.status === "deleted") {
          setIsDeleted(true);
        } else if (lookup.status === "exists" && lookup.product) {
          const productData = lookup.product;
          setProduct(productData);
          if (isUuid && productData.slug) { navigate(getProductUrl(productData), { replace: true }); return; }
          // Run owner lookup and favorite check in parallel — they don't depend on each other.
          const [ownerRes, favRes] = await Promise.all([
            supabase.rpc('get_product_owner_public_info', { owner_uuid: productData.owner_id }),
            user ? isProductFavorite(productData.id) : Promise.resolve(false),
          ]);
          if (ownerRes.data && ownerRes.data.length > 0) setOwner(ownerRes.data[0]);
          if (user) setIsFavorite(!!favRes);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchProduct();
  }, [slug, user]);

  const { bookedDates } = useBookedDates(product?.id);
  const { data: extendedStats } = useProductExtendedStats(product?.id);

  // Track product view (deduped server-side per visitor / 24h)
  useEffect(() => {
    if (!product?.id) return;
    // Only count views once the visitor accepted statistics cookies.
    purgeIfNoConsent("statistics", ["rentli_visitor_id"]);
    if (!hasConsent("statistics")) return;
    let visitorHash = "";
    try {
      visitorHash = localStorage.getItem("rentli_visitor_id") || "";
      if (!visitorHash) {
        visitorHash = crypto.randomUUID();
        localStorage.setItem("rentli_visitor_id", visitorHash);
      }
    } catch {
      return;
    }
    supabase.rpc("track_product_view", { p_product_id: product.id, p_visitor_hash: visitorHash });
  }, [product?.id]);

  // Track recently viewed
  useEffect(() => {
    if (!product) return;
    trackRecentlyViewed({
      id: product.id,
      slug: product.slug,
      title: (language === "en" && product.title_en) ? product.title_en : product.title,
      image: product.images?.[0],
      price: calculateClientPrice(product.daily_price_owner, product.platform_fee_percent),
      city: product.location_city,
    });
  }, [product, language]);

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
    // Prime the conversations list so Messages can select it immediately.
    if (user) queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
    return conv;
  };

  const buildReturnTo = () => ({
    returnTo: {
      pathname: window.location.pathname,
      search: window.location.search,
    },
  });

  const handleStartChat = async () => {
    const conv = await ensureConversation();
    if (conv) navigate(`/mesaje?conv=${conv.id}`, { state: buildReturnTo() });
  };

  const handleQuickQuestion = async (message: string) => {
    const conv = await ensureConversation();
    if (!conv) return;
    await sendMessage(conv.id, message);
    navigate(`/mesaje?conv=${conv.id}`, { state: buildReturnTo() });
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
    // No selection yet, or already a multi-day range → start fresh as a 1-day booking
    if (!startDate || !endDate || startDate.getTime() !== endDate.getTime()) {
      setStartDate(date);
      setEndDate(date);
      return;
    }
    // We have a 1-day booking (start === end). Second click extends or moves the range.
    if (date.getTime() === startDate.getTime()) return;
    if (isBefore(date, startDate)) {
      if (hasBookedDateInRange(date, startDate, bookedDates)) {
        setConflictDates(bookedDates.filter((d) => d >= date && d <= startDate));
        setConflictOpen(true);
        return;
      }
      setStartDate(date);
      return;
    }
    if (hasBookedDateInRange(startDate, date, bookedDates)) {
      setConflictDates(bookedDates.filter((d) => d >= startDate && d <= date));
      setConflictOpen(true);
      return;
    }
    setEndDate(date);
  };
  const clearDates = () => { setStartDate(undefined); setEndDate(undefined); };
  const rentalDays = useMemo(() => (startDate && endDate) ? differenceInDays(endDate, startDate) + 1 : 0, [startDate, endDate]);

  // SEO (must run before early returns to keep hook order stable)
  const seoLocation = product?.location_city || (language === "en" ? "Romania" : "România");
  const seoDisplayTitle = product ? ((language === "en" && product.title_en) ? product.title_en : product.title) : "";
  const seoDisplayDesc = product ? ((language === "en" && product.description_en) ? product.description_en : product.description) : "";
  const seoPrice = Math.round(clientPrice);
  const SEO_BRAND_SUFFIX = " | Rentli";
  const seoTitle = (() => {
    if (!product) return "Rentli";
    const max = META_TITLE_MAX - SEO_BRAND_SUFFIX.length;
    const priceTail = language === "en" ? `${seoPrice} lei/day` : `${seoPrice} lei/zi`;
    const withCity = language === "en"
      ? `Rent ${seoDisplayTitle} in ${seoLocation} — ${priceTail}`
      : `Închiriere ${seoDisplayTitle} în ${seoLocation} — ${priceTail}`;
    if (withCity.length <= max) return withCity + SEO_BRAND_SUFFIX;
    const noCity = language === "en"
      ? `Rent ${seoDisplayTitle} — ${priceTail}`
      : `Închiriere ${seoDisplayTitle} — ${priceTail}`;
    if (noCity.length <= max) return noCity + SEO_BRAND_SUFFIX;
    // Shorten the product title itself, always keeping the price tail readable.
    const prefix = language === "en" ? "Rent " : "Închiriere ";
    const room = max - prefix.length - priceTail.length - 4; // " — " + ellipsis
    const shortTitle = room > 10 ? `${seoDisplayTitle.slice(0, room).trimEnd()}…` : seoDisplayTitle;
    return truncateForMeta(`${prefix}${shortTitle} — ${priceTail}`, max) + SEO_BRAND_SUFFIX;
  })();


  const cleanedDesc = cleanUserDescription(seoDisplayDesc);
  const seoLead = language === "en"
    ? `${seoDisplayTitle} for rent in ${seoLocation}, ${seoPrice} lei/day.`
    : `${seoDisplayTitle} de închiriat în ${seoLocation}, ${seoPrice} lei/zi.`;
  const seoFallback = t(
    "Plată securizată, predare documentată cu poze și proprietari verificați pe Rentli.",
    "Secure payment, photo-documented handover and verified owners on Rentli.",
  );
  const seoDesc = product
    ? buildMeta([seoLead, cleanedDesc.length >= 40 ? cleanedDesc : seoFallback], META_DESCRIPTION_MAX)
    : t(
        "Închiriază pe Rentli. Plată securizată, predare cu poze, suport 7/7.",
        "Rent on Rentli. Secure payment, photo handover, 7/7 support.",
      );
  // The first uploaded photo is the listing cover everywhere, including SEO.
  const seoFirstImage = images.find((i) => i && i !== "/placeholder.svg" && !i.includes("placeholder"));
  const origin = CANONICAL_ORIGIN;
  const seoImage = seoFirstImage
    ? (seoFirstImage.startsWith("http") ? seoFirstImage : `${origin}${seoFirstImage}`)
    : "https://rentli.ro/og-image.jpg?v=3";
  const canonicalUrl = product
    ? `${CANONICAL_ORIGIN}${getProductUrl(product)}`
    : `${CANONICAL_ORIGIN}${typeof window !== "undefined" ? window.location.pathname : ""}`;
  const seoCategory = product?.category ? (categories.find((c) => c.name === product.category) || null) : null;
  const seoPriceValidUntil = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();
  useSEO({
    title: seoTitle,
    description: seoDesc,
    image: seoImage,
    imageAlt: seoDisplayTitle,
    url: canonicalUrl,
    canonical: canonicalUrl,
    type: "product",
    // Unavailable / deleted listings must not stay in the index.
    noindex: isPreview || (!isLoading && !product),
    jsonLd: product ? {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          name: seoDisplayTitle,
          description: seoDesc,
          sku: product.id,
          image: images.filter(i => i && i !== "/placeholder.svg" && !i.includes("placeholder")).map(i => i.startsWith("http") ? i : `${origin}${i}`),
          brand: { "@type": "Brand", name: "Rentli" },
          category: product.category || undefined,
          itemCondition: product.condition === "new"
            ? "https://schema.org/NewCondition"
            : "https://schema.org/UsedCondition",
          offers: {
            "@type": "Offer",
            price: clientPrice,
            priceCurrency: "RON",
            priceValidUntil: seoPriceValidUntil,
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
            areaServed: { "@type": "Place", name: seoLocation },
            seller: { "@type": "Person", name: owner?.full_name || "Rentli" },
          },
          ...(extendedStats?.owner_avg_rating && extendedStats.owner_review_count ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(extendedStats.owner_avg_rating).toFixed(1),
              reviewCount: extendedStats.owner_review_count,
            },
          } : {}),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: language === "en" ? "Home" : "Acasă", item: "https://rentli.ro/" },
            ...(seoCategory
              ? [{
                  "@type": "ListItem",
                  position: 2,
                  name: language === "en" ? (seoCategory.nameEn || seoCategory.name) : seoCategory.name,
                  item: `https://rentli.ro/categorie/${seoCategory.slug}`,
                }]
              : []),
            {
              "@type": "ListItem",
              position: seoCategory ? 3 : 2,
              name: seoDisplayTitle,
              item: canonicalUrl,
            },
          ],
        },
      ],
    } : null,
  });


  const handleReserve = () => {
    if (!product || !startDate || !endDate) return;
    const totalPrice = computeRentalPrice(rentalDays, Number(product.daily_price_owner) || 0, priceWeek, priceMonth, product.platform_fee_percent ?? 0).subtotal;
    navigate('/checkout', { state: { product: { id: product.id, title: displayTitle, images, price: Number(product.daily_price_owner) || 0, priceUnit: "zi", location, ownerId: product.owner_id, platformFeePercent: product.platform_fee_percent }, startDate, endDate, rentalDays, totalPrice } });
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
  if (isDeleted) return <DeletedProductNotice />;
  if (!product) return (<div className="min-h-screen bg-background"><Navbar /><main className="container py-16 text-center"><h1 className="font-heading text-2xl font-bold text-foreground">{copy.product.notFound}</h1><Button asChild className="mt-4"><Link to="/categorii">{copy.product.backToCategories}</Link></Button></main><Footer /></div>);

  const location = product.location_city || "România";
  const ownerName = owner?.full_name || copy.dashboard.owner;
  const displayTitle = (language === "en" && product.title_en) ? product.title_en : product.title;
  const displayDescription = (language === "en" && product.description_en) ? product.description_en : product.description;
  const isOwnProduct = user?.id === product.owner_id;
  const approvalStatus = (product as any).approval_status as string | undefined;
  const isPubliclyVisible = approvalStatus === "approved" && product.is_active !== false;

  // Not publicly visible and viewer isn't the owner → behave as Not Found.
  if (!isPubliclyVisible && !isOwnProduct && !isPreview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">{copy.product.notFound}</h1>
          <Button asChild className="mt-4"><Link to="/categorii">{copy.product.backToCategories}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {isPreview && isOwnProduct && <PreviewBanner />}
      <Navbar />
      <MobileFixedBackButton />

      <StickyProductHeader
        title={displayTitle}
        clientPrice={clientPrice}
        rating={extendedStats?.owner_avg_rating}
        reviewCount={extendedStats?.owner_review_count}
        triggerRef={titleBlockRef}
        onReserve={handleReserve}
        isOwnProduct={isOwnProduct || !isPubliclyVisible}
      />

      <ProductImageGallery
        variant="mobile"
        images={images}
        title={displayTitle}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onOpenLightbox={openLightbox}
      />

      <main className="w-full max-w-7xl mx-auto py-6 px-[10px] md:px-6 lg:px-8">
        {!isPubliclyVisible && isOwnProduct && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${
              approvalStatus === "rejected"
                ? "border-rose-200 bg-rose-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                approvalStatus === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {approvalStatus === "rejected" ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-sm ${approvalStatus === "rejected" ? "text-rose-900" : "text-amber-900"}`}>
                {approvalStatus === "rejected"
                  ? t("Anunț respins — nu este vizibil public", "Listing rejected — not publicly visible")
                  : approvalStatus === "pending"
                  ? t("Anunț în așteptarea aprobării — nu este vizibil public", "Listing pending approval — not publicly visible")
                  : t("Anunț ascuns — nu este vizibil public", "Listing hidden — not publicly visible")}
              </p>
              <p className={`text-xs mt-1 ${approvalStatus === "rejected" ? "text-rose-800" : "text-amber-800"}`}>
                {approvalStatus === "rejected"
                  ? t("Editează anunțul pentru a-l retrimite spre aprobare.", "Edit the listing to resubmit it for approval.")
                  : t("Doar tu poți vedea această pagină.", "Only you can see this page.")}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to={`/owner/edit-product/${product.id}`}>
                <Edit className="h-4 w-4" /> {t("Editează", "Edit")}
              </Link>
            </Button>
          </div>
        )}

        {isOwnProduct && isPubliclyVisible && !isPreview && (
          <OwnerProductActions productId={product.id} productTitle={displayTitle} variant="bar" />
        )}

        <nav className="mb-4 hidden md:flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          <Link to="/categorii" className="hover:text-primary text-xs whitespace-nowrap">{copy.product.allCategories}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {category && (<><Link to={`/categorie/${category.slug}`} className="hover:text-primary text-xs whitespace-nowrap">{language === "en" ? category.nameEn : category.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          {subcategory && (<><Link to={`/subcategorie/${subcategory.id}`} className="hover:text-primary whitespace-nowrap">{language === "en" ? subcategory.nameEn : subcategory.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          <span className="text-foreground whitespace-nowrap">{displayTitle}</span>
        </nav>

        {/* Title block — single H1 with responsive layout */}
        <div ref={titleBlockRef} className="flex items-start justify-between gap-4 mb-5 lg:mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl lg:text-3xl font-semibold text-foreground">{displayTitle}</h1>
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 mt-1 lg:mt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{location}</span>
              {product.condition && product.condition in CONDITION_LABELS && (
                <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {t("Stare", "Condition")}: {CONDITION_LABELS[product.condition as ProductCondition][language]}
                </span>
              )}
              <div className="lg:contents mt-2 lg:mt-0">
                <SocialProofStrip
                  timesRented={extendedStats?.times_rented}
                  watchersCount={extendedStats?.watchers_count}
                  lastBookingAt={extendedStats?.last_booking_at}
                  viewsCount={extendedStats?.views_count}
                />
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0">
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

            <OwnerTrustCard
              ownerId={product.owner_id}
              ownerName={ownerName}
              ownerAvatar={owner?.avatar_url}
              isOwnProduct={isOwnProduct}
              stats={extendedStats}
            />

            <ProductInfoAccordion
              description={displayDescription}
              includedItems={
                language === "en" &&
                Array.isArray((product as any).included_items_en) &&
                (product as any).included_items_en.length === ((product as any).included_items?.length ?? -1) &&
                (product as any).included_items_en.length > 0
                  ? (product as any).included_items_en
                  : (product as any).included_items
              }
              usageRules={(product as any).usage_rules}
            />

            <LocationCard address={product.pickup_address || location} city={product.location_city} />

            <Suspense fallback={<div className="h-32" />}>
              <ProductReviewsSection productId={product.id} isOwnProduct={isOwnProduct} />
            </Suspense>
          </div>

          {/* Booking card — inline on mobile, sticky sidebar on desktop */}
          <div className="order-1 lg:order-2 lg:self-stretch">
            <div className="lg:sticky lg:top-24">
              <PremiumBookingCard
                clientPrice={clientPrice}
                ownerPrice={Number(product.daily_price_owner) || 0}
                priceWeek={priceWeek}
                priceMonth={priceMonth}
                startDate={startDate}
                endDate={endDate}
                bookedDates={bookedDates}
                onSelectDate={handleDateSelect}
                onClear={clearDates}
                onReserve={handleReserve}
                onAsk={handleStartChat}
                isOwnProduct={isOwnProduct || !isPubliclyVisible}
                responseMinutes={extendedStats?.owner_response_minutes}
                ownerVerified={false}
                minRentalDays={product.min_rental_days}
                maxRentalDays={(product as any).max_rental_days ?? null}
                platformFeePercent={product.platform_fee_percent ?? 0}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Suspense fallback={<div className="h-40" />}>
            <OwnerOtherListings ownerId={product.owner_id} currentProductId={product.id} ownerName={ownerName} />
          </Suspense>
        </div>

        <div className="mt-8">
          <Suspense fallback={<div className="h-40" />}>
            <NearbyProductsSlider currentProductId={product.id} locationCity={product.location_city} category={product.category} />
          </Suspense>
        </div>

        <Suspense fallback={<div className="h-40" />}>
          <RecentlyViewedSlider excludeId={product.id} />
        </Suspense>
      </main>

      <Footer />

      {/* Mobile sticky booking bar */}
      <MobileStickyBookingBar
        clientPrice={clientPrice}
                ownerPrice={Number(product.daily_price_owner) || 0}
        priceWeek={priceWeek}
        priceMonth={priceMonth}
        startDate={startDate}
        endDate={endDate}
        bookedDates={bookedDates}
        onSelectDate={handleDateSelect}
        onClear={clearDates}
        onReserve={handleReserve}
        onAsk={handleStartChat}
        isOwnProduct={isOwnProduct || !isPubliclyVisible}
        responseMinutes={extendedStats?.owner_response_minutes}
        ownerVerified={false}
        minRentalDays={product.min_rental_days}
        maxRentalDays={(product as any).max_rental_days ?? null}
        platformFeePercent={product.platform_fee_percent ?? 0}
      />

      {lightboxOpen && (
        <Suspense fallback={null}>
          <PremiumLightbox
            open={lightboxOpen}
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={setLightboxIndex}
            title={displayTitle}
          />
        </Suspense>
      )}

      {shareOpen && (
        <Suspense fallback={null}>
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            url={canonicalUrl}
            title={displayTitle}
            image={seoImage}
          />
        </Suspense>
      )}

      <BookedDatesAlert
        open={conflictOpen}
        dates={conflictDates}
        onClose={() => {
          setConflictOpen(false);
          setStartDate(undefined);
          setEndDate(undefined);
        }}
      />
    </div>
  );
};

export default ProductDetail;
