import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format, differenceInDays, isBefore } from "date-fns";
import { useBookedDates, isDateBooked, hasBookedDateInRange } from "@/hooks/queries/useBookedDates";
import { ro, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin, Star, Shield, Clock, MessageCircle, Check, User, Calendar, ArrowLeft, Share2, Heart, Loader2, Phone, Mail, Info, ThumbsUp, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/categories";
import { getProductById, getProductBySlug, Product, calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getOrCreateConversation } from "@/features/messaging/messagingApi";
import { ChatDialog } from "@/components/messaging/ChatDialog";
import NearbyProductsSlider from "@/components/products/NearbyProductsSlider";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import OwnerSection from "@/components/product/OwnerSection";
import ProductIncludes from "@/components/product/ProductIncludes";
import UsageRules from "@/components/product/UsageRules";
import OwnerOtherListings from "@/components/product/OwnerOtherListings";
import ProductReviewsSection from "@/components/product/ProductReviewsSection";
import { useUserStatistics } from "@/hooks/queries/useUserProfile";

import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";
import { computeRentalPrice } from "@/lib/rentalPricing";

interface OwnerInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const OwnerSectionWithStats = ({ ownerId, ownerName, ownerAvatar, responseTime, responseRate, isOwnProduct, onStartChat }: {
  ownerId: string; ownerName: string; ownerAvatar?: string | null; responseTime?: string; responseRate?: string; isOwnProduct?: boolean; onStartChat?: () => void;
}) => {
  const { data: statistics } = useUserStatistics(ownerId);
  const memberSinceYear = statistics?.member_since ? new Date(statistics.member_since).getFullYear().toString() : "N/A";
  return (
    <OwnerSection
      ownerId={ownerId}
      ownerName={ownerName}
      ownerAvatar={ownerAvatar}
      rating={statistics?.average_rating ?? 0}
      reviewCount={statistics?.reviews_count ?? 0}
      memberSince={memberSinceYear}
      responseTime={responseTime}
      responseRate={responseRate}
      isOwnProduct={isOwnProduct}
      onStartChat={onStartChat}
    />
  );
};


const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const copy = useUxCopy();
  const { language } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;

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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        // Try UUID lookup first, then slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const productData = isUuid
          ? await getProductById(slug)
          : await getProductBySlug(slug);
        if (productData) {
          setProduct(productData);
          // Redirect old UUID URLs to slug URL
          if (isUuid && productData.slug) {
            navigate(getProductUrl(productData), { replace: true });
            return;
          }
          const { data: ownerData } = await supabase.rpc('get_product_owner_public_info', { owner_uuid: productData.owner_id });
          if (ownerData && ownerData.length > 0) setOwner(ownerData[0]);
          if (user) {
            const fav = await isProductFavorite(productData.id);
            setIsFavorite(fav);
          }
        }
      } catch (error) { console.error("Error fetching product:", error); }
      finally { setIsLoading(false); }
    };
    fetchProduct();
  }, [slug, user]);

  const handleStartChat = async () => {
    if (!user) {
      toast({ title: copy.productDetail.authRequired, description: copy.productDetail.authRequiredDesc, variant: "destructive" });
      navigate('/auth', { replace: true });
      return;
    }
    if (!product || user.id === product.owner_id) {
      toast({ title: copy.productDetail.cantContact, description: copy.productDetail.cantContactDesc, variant: "destructive" });
      return;
    }
    const conversation = await getOrCreateConversation(product.id, product.owner_id);
    if (conversation) { setConversationId(conversation.id); setChatOpen(true); }
    else { toast({ title: copy.auth.errorGeneric, description: copy.productDetail.conversationError, variant: "destructive" }); }
  };

  const category = product?.category ? categories.find(c => c.name === product.category) : null;
  const subcategory = product?.subcategory && category ? category.subcategories.find(s => s.id === product.subcategory) : null;
  const clientPrice = product ? calculateClientPrice(product.daily_price_owner, product.platform_fee_percent) : 0;
  const priceWeek = Math.round(clientPrice * 6);
  const priceMonth = Math.round(clientPrice * 22);
  const images = product?.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [lightboxOpen, images.length]);

  const { bookedDates } = useBookedDates(product?.id);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDateBooked(date, bookedDates)) return;
    if (!startDate || (startDate && endDate)) { setStartDate(date); setEndDate(undefined); }
    else if (isBefore(date, startDate)) { setStartDate(date); }
    else {
      if (hasBookedDateInRange(startDate, date, bookedDates)) {
        toast({ title: language === "ro" ? "Perioada indisponibilă" : "Period unavailable", description: language === "ro" ? "Există zile rezervate în intervalul selectat." : "There are booked days in the selected range.", variant: "destructive" });
        return;
      }
      setEndDate(date);
    }
  };
  const clearDates = () => { setStartDate(undefined); setEndDate(undefined); };

  const rentalDays = useMemo(() => { if (startDate && endDate) return differenceInDays(endDate, startDate) + 1; return 0; }, [startDate, endDate]);
  const priceBreakdown = useMemo(
    () => computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth),
    [rentalDays, clientPrice, priceWeek, priceMonth]
  );
  const totalPrice = priceBreakdown.total;


  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: product?.title || "Produs", url: window.location.href }); } catch (err) { console.log('Share cancelled'); } }
    else { navigator.clipboard.writeText(window.location.href); }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({ title: copy.favorites?.loginRequired || "Login required", variant: "destructive" });
      navigate('/auth', { replace: true });
      return;
    }
    if (!product) return;
    try {
      if (isFavorite) {
        await removeFavoriteProduct(product.id);
        setIsFavorite(false);
        toast({ title: copy.favorites?.removed || "Removed from favorites" });
      } else {
        await addFavoriteProduct(product.id);
        setIsFavorite(true);
        toast({ title: copy.favorites?.added || "Added to favorites" });
      }
    } catch {
      toast({ title: copy.auth?.errorGeneric || "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (<div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-24"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div><Footer /></div>);
  }

  if (!product) {
    return (<div className="min-h-screen bg-background"><Navbar /><main className="container py-16 text-center"><h1 className="font-heading text-2xl font-bold text-foreground">{copy.product.notFound}</h1><Button asChild className="mt-4"><Link to="/categorii">{copy.product.backToCategories}</Link></Button></main><Footer /></div>);
  }

  const location = product.location_city || "România";
  const ownerName = owner?.full_name || copy.dashboard.owner;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ProductImageGallery
        variant="mobile"
        images={images}
        title={product.title}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onBack={() => navigate(-1)}
        onOpenLightbox={openLightbox}
      />

      <main className="w-full max-w-7xl mx-auto py-6 px-[10px] md:px-6 lg:px-8">
        <nav className="mb-6 hidden md:flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          <Link to="/categorii" className="hover:text-primary text-xs whitespace-nowrap">{copy.product.allCategories}</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {category && (<><Link to={`/categorie/${category.slug}`} className="hover:text-primary text-xs whitespace-nowrap">{category.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          {subcategory && (<><Link to={`/subcategorie/${subcategory.id}`} className="hover:text-primary whitespace-nowrap">{subcategory.name}</Link><ChevronRight className="h-4 w-4 flex-shrink-0" /></>)}
          <span className="text-foreground whitespace-nowrap">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6 order-2 lg:order-1">
            <ProductImageGallery
              variant="desktop"
              images={images}
              title={product.title}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onOpenLightbox={openLightbox}
            />

            <OwnerSectionWithStats ownerId={product.owner_id} ownerName={ownerName} ownerAvatar={owner?.avatar_url} responseTime={copy.owner.responseTimeValue} responseRate="98%" isOwnProduct={user?.id === product.owner_id} onStartChat={handleStartChat} />

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{copy.product.description}</h2>
              <p className="text-muted-foreground">{product.description || copy.product.noDescription}</p>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-foreground mb-4"><MapPin className="h-5 w-5 text-primary" /><span className="font-medium">{product.pickup_address || location}</span></div>
              <div className="rounded-lg overflow-hidden h-[300px] bg-muted">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent((product.pickup_address || location) + ', Romania')}&output=embed`}
                  allowFullScreen
                />
              </div>
            </div>

            <ProductIncludes items={(product as any).included_items} />
            <UsageRules />

            <ProductReviewsSection productId={product.id} isOwnProduct={user?.id === product.owner_id} />
          </div>

          {/* Right Sidebar - Booking */}
          <div className="order-1 lg:order-2 lg:self-stretch">
            <div className="lg:sticky lg:top-24 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 lg:hidden">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{location}</span>
              </div>
              <div className="flex items-start justify-between gap-3 mb-3 lg:hidden">
                <h1 className="font-heading text-[25px] font-semibold text-foreground leading-tight flex-1">{product.title}</h1>
                <button onClick={handleToggleFavorite} className="flex-shrink-0 mt-1"><Heart className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} /></button>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{location}</span>
              </div>
              <h1 className="hidden lg:block font-heading text-2xl font-semibold text-foreground mb-3">{product.title}</h1>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-1"><span className="font-heading text-2xl font-bold text-primary">{clientPrice} RON</span><span className="text-muted-foreground">{copy.common.perDay}</span></div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>{priceWeek} RON / {copy.productDetail.week}</p>
                  <p>{priceMonth} RON / {copy.productDetail.month}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{copy.booking.steps.period}</h3>
                  {(startDate || endDate) && <button onClick={clearDates} className="text-xs text-primary hover:underline">{copy.common.clear}</button>}
                </div>
                <CalendarComponent mode="single" selected={endDate || startDate} onSelect={handleDateSelect} disabled={date => isBefore(date, new Date()) || isDateBooked(date, bookedDates)} modifiers={{ start: startDate, end: endDate, range: startDate && endDate ? { from: startDate, to: endDate } : undefined, today: new Date() }} modifiersStyles={{ start: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" }, end: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" }, range: { backgroundColor: "#FA8729", color: "white", borderRadius: "10px" }, today: { backgroundColor: "#000000", color: "#ffffff", borderRadius: "10px", fontWeight: 700 } }} classNames={{ day_selected: "!bg-[#FA8729] !text-white !rounded-[10px] !opacity-100" }} className="rounded-md border w-full pointer-events-auto [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-head_cell]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs [&_.rdp-day]:rounded-[10px]" />
              </div>

              {startDate && endDate && (
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{copy.booking.priceBreakdown.perDay}:</span><span className="font-medium">{format(startDate, "d MMM yyyy", { locale: dateLocale })}</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">{copy.productDetail.untilLabel}:</span><span className="font-medium">{format(endDate, "d MMM yyyy", { locale: dateLocale })}</span></div>
                  <Separator className="my-3" />
                  {priceBreakdown.months > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {priceBreakdown.months} × {language === "ro" ? "30 zile" : "30 days"} × {priceMonth} RON
                      </span>
                      <span className="font-medium">{priceBreakdown.months * priceMonth} RON</span>
                    </div>
                  )}
                  {priceBreakdown.weeks > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        {priceBreakdown.weeks} {language === "ro"
                          ? (priceBreakdown.weeks === 1 ? "săptămână" : "săptămâni")
                          : (priceBreakdown.weeks === 1 ? "week" : "weeks")} × {priceWeek} RON
                      </span>
                      <span className="font-medium">{priceBreakdown.weeks * priceWeek} RON</span>
                    </div>
                  )}
                  {priceBreakdown.days > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        {priceBreakdown.days} {language === "ro"
                          ? (priceBreakdown.days === 1 ? "zi" : "zile")
                          : (priceBreakdown.days === 1 ? "day" : "days")} × {clientPrice} RON
                      </span>
                      <span className="font-medium">{Math.round(priceBreakdown.days * clientPrice * 100) / 100} RON</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 font-semibold"><span>{copy.booking.priceBreakdown.total}</span><span className="text-primary">{totalPrice} RON</span></div>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={!startDate || !endDate} onClick={() => { if (startDate && endDate) { navigate('/checkout', { state: { product: { id: product.id, title: product.title, images, price: clientPrice, priceUnit: "zi", location, ownerId: product.owner_id, platformFeePercent: product.platform_fee_percent }, startDate, endDate, rentalDays, totalPrice } }); } }}>
                {startDate && endDate ? copy.booking.ctaPrimary : copy.booking.steps.period}
              </Button>

              <Separator className="my-4" />
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Anulare gratuită</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Anulează gratuit cu 48h înainte de începerea închirierii. Rambursare parțială după. Consultă{" "}
                    <Link to="/politica-anulare" className="text-primary hover:underline font-medium">politica de anulare</Link>
                    {" "}pentru mai multe detalii.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <OwnerOtherListings ownerId={product.owner_id} currentProductId={product.id} ownerName={ownerName} />
        </div>

        <div className="mt-8">
          <NearbyProductsSlider currentProductId={product.id} locationCity={product.location_city} category={product.category} />
        </div>
      </main>

      <Footer />

      {conversationId && (
        <ChatDialog open={chatOpen} onOpenChange={setChatOpen} conversationId={conversationId} otherUserName={owner?.full_name || null} otherUserAvatar={owner?.avatar_url || null} productTitle={product?.title || 'Produs'} />
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={() => setLightboxOpen(false)}>
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + images.length) % images.length); }}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % images.length); }}>
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img src={images[lightboxIndex]} alt={product?.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (<button key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i === lightboxIndex ? "bg-white" : "bg-white/40"}`} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }} />))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
