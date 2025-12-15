import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { format, differenceInDays, isBefore, isAfter, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin, Star, Shield, Clock, MessageCircle, Check, User, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/categories";
import { getItemById, mockItems } from "@/data/mockItems";
const reviews = [{
  id: "r1",
  userName: "Maria Ionescu",
  userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  rating: 5,
  comment: "Produs excelent, în stare perfectă! Recomand cu încredere!",
  date: "2024-11-15"
}, {
  id: "r2",
  userName: "Andrei Marin",
  userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  rating: 5,
  comment: "Am închiriat pentru un weekend. Totul a fost perfect!",
  date: "2024-10-28"
}, {
  id: "r3",
  userName: "Elena Dumitrescu",
  userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  rating: 4,
  comment: "Foarte bun, recomand!",
  date: "2024-09-12"
}];
const ProductDetail = () => {
  const {
    id
  } = useParams();
  const product = getItemById(id || "") || mockItems[0];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === product.subcategoryId);
  const priceWeek = Math.round(product.price * 6);
  const priceMonth = Math.round(product.price * 22);
  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!startDate || startDate && endDate) {
      setStartDate(date);
      setEndDate(undefined);
    } else if (isBefore(date, startDate)) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  const clearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };
  const rentalDays = useMemo(() => {
    if (startDate && endDate) return differenceInDays(endDate, startDate) + 1;
    return 0;
  }, [startDate, endDate]);
  const totalPrice = useMemo(() => {
    if (rentalDays === 0) return 0;
    if (rentalDays >= 30) return Math.ceil(rentalDays / 30) * priceMonth;
    if (rentalDays >= 7) {
      const weeks = Math.floor(rentalDays / 7);
      const extraDays = rentalDays % 7;
      return weeks * priceWeek + extraDays * product.price;
    }
    return rentalDays * product.price;
  }, [rentalDays, product.price, priceWeek, priceMonth]);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-6 px-[15px] md:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/categorii" className="hover:text-primary text-xs">Toate categoriile</Link>
          <ChevronRight className="h-4 w-4" />
          {category && <>
              <Link to={`/categorie/${category.id}`} className="hover:text-primary text-xs">{category.name}</Link>
              <ChevronRight className="h-4 w-4" />
            </>}
          {subcategory && <>
              <Link to={`/subcategorie/${subcategory.id}`} className="hover:text-primary">{subcategory.name}</Link>
              <ChevronRight className="h-4 w-4" />
            </>}
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3 mx-auto max-w-7xl">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Image Gallery */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <div className="aspect-[4/3]">
                <img src={product.images[currentImageIndex]} alt={product.title} className="h-full w-full object-cover" />
              </div>
              {product.images.length > 1 && <>
                  <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={prevImage}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={nextImage}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => <button key={index} className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-primary" : "bg-background/60"}`} onClick={() => setCurrentImageIndex(index)} />)}
                  </div>
                </>}
            </div>

            {/* Owner Info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={product.owner.avatar} />
                    <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{product.owner.name}</h3>
                      <Badge variant="secondary" className="text-xs"><Check className="mr-1 h-3 w-3" />Verificat</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-muted-foreground">({product.reviewCount} recenzii)</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Membru din {product.owner.memberSince}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm"><MessageCircle className="mr-2 h-4 w-4" />Trimite mesaj</Button>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>Răspunde în &lt; 1 oră</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /><span>Rată răspuns: 98%</span></div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
                <Shield className="h-5 w-5 text-primary" /><span className="text-foreground">Închirierea este asigurată</span>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-foreground"><MapPin className="h-5 w-5 text-primary" /><span className="font-medium">{product.location}</span></div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Descriere</h2>
              <p className="text-muted-foreground">{product.description}</p>
              {product.features.length > 0 && <>
                  <Separator className="my-6" />
                  <h3 className="mb-3 font-medium text-foreground">Caracteristici</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, index) => <Badge key={index} variant="secondary">{feature}</Badge>)}
                  </div>
                </>}
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">Recenzii ({reviews.length})</h2>
                <div className="flex items-center gap-1"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /><span className="font-semibold">{product.rating}</span></div>
              </div>
              <div className="space-y-4">
                {displayedReviews.map(review => <div key={review.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={review.userAvatar} /><AvatarFallback><User className="h-5 w-5" /></AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium text-foreground">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">{Array.from({
                          length: 5
                        }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
                          <span className="text-xs text-muted-foreground">{format(new Date(review.date), "d MMMM yyyy", {
                          locale: ro
                        })}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </div>)}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Booking */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold text-foreground">{product.price} RON</span>
                  <span className="text-muted-foreground">/ {product.priceUnit}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>{priceWeek} RON / săptămână</p>
                  <p>{priceMonth} RON / lună</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Selectează perioada</h3>
                  {(startDate || endDate) && <button onClick={clearDates} className="text-xs text-primary hover:underline">Șterge</button>}
                </div>
                <CalendarComponent mode="single" selected={endDate || startDate} onSelect={handleDateSelect} disabled={date => isBefore(date, new Date())} modifiers={{
                start: startDate,
                end: endDate,
                range: startDate && endDate ? {
                  from: startDate,
                  to: endDate
                } : undefined
              }} modifiersStyles={{
                start: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white"
                },
                end: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white"
                },
                range: {
                  backgroundColor: "hsl(var(--primary) / 0.1)"
                }
              }} className="rounded-md border w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full" />
              </div>

              {startDate && endDate && <div className="mb-4 rounded-lg bg-muted p-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">De la:</span><span className="font-medium">{format(startDate, "d MMM yyyy", {
                    locale: ro
                  })}</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Până la:</span><span className="font-medium">{format(endDate, "d MMM yyyy", {
                    locale: ro
                  })}</span></div>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{rentalDays} zile × {product.price} RON</span><span className="font-medium">{totalPrice} RON</span></div>
                  <div className="flex justify-between mt-2 font-semibold"><span>Total</span><span className="text-primary">{totalPrice} RON</span></div>
                </div>}

              <Button className="w-full" size="lg" disabled={!startDate || !endDate}>
                {startDate && endDate ? "Rezervă acum" : "Selectează perioada"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default ProductDetail;