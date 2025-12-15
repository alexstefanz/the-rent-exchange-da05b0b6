import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { format, addDays, differenceInDays, isBefore, isAfter, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Star, 
  Shield, 
  Clock, 
  MessageCircle,
  Calendar,
  Check,
  User,
  Flag
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/categories";

// Mock product data - in real app would come from API
const mockProducts: Record<string, {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  priceWeek: number;
  priceMonth: number;
  images: string[];
  location: string;
  categoryId: number;
  subcategoryId: string;
  features: string[];
  owner: {
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    responseTime: string;
    responseRate: number;
    memberSince: string;
    verified: boolean;
  };
  reviews: Array<{
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}> = {
  "1": {
    id: "1",
    title: "Bicicletă MTB Cube Reaction Pro 29",
    description: "Bicicletă de munte profesională, perfectă pentru trasee montane",
    longDescription: `Bicicletă MTB Cube Reaction Pro 29 în stare excelentă, ideală pentru trasee montane și downhill.

Specificații:
- Roți 29 inch
- Cadru aluminiu ușor
- Suspensie față Rock Shox
- Frâne hidraulice Shimano
- Schimbător Shimano Deore XT

Include:
- Cască de protecție
- Pompă portabilă
- Kit reparații pană
- Lacăt anti-furt

Bicicleta este întreținută regulat și este pregătită pentru orice aventură!`,
    price: 80,
    priceWeek: 450,
    priceMonth: 1500,
    images: [
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    ],
    location: "București, Sector 1",
    categoryId: 1,
    subcategoryId: "1-2",
    features: ["Suspensie față", "Frâne hidraulice", "29 inch", "Cască inclusă"],
    owner: {
      name: "Alexandru Popescu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      rating: 4.9,
      reviewCount: 47,
      responseTime: "< 1 oră",
      responseRate: 98,
      memberSince: "2022",
      verified: true,
    },
    reviews: [
      {
        id: "r1",
        userName: "Maria Ionescu",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
        rating: 5,
        comment: "Bicicletă excelentă, în stare perfectă! Alexandru a fost foarte amabil și comunicativ. Recomand cu încredere!",
        date: "2024-11-15",
      },
      {
        id: "r2",
        userName: "Andrei Marin",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
        rating: 5,
        comment: "Am închiriat pentru un weekend la munte. Totul a fost perfect!",
        date: "2024-10-28",
      },
      {
        id: "r3",
        userName: "Elena Dumitrescu",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
        rating: 4,
        comment: "Foarte bună bicicletă, recomand!",
        date: "2024-09-12",
      },
    ],
  },
};

// Generate mock product for any ID
const getProduct = (id: string) => {
  if (mockProducts[id]) return mockProducts[id];
  
  // Generate a mock product for any ID
  return {
    id,
    title: `Produs de Închiriat #${id}`,
    description: "Produs de calitate disponibil pentru închiriere",
    longDescription: `Descriere detaliată a produsului #${id}. 
    
Acest produs este în stare excelentă și include toate accesoriile necesare.

Caracteristici principale:
- Calitate superioară
- Stare excelentă
- Întreținut regulat
- Disponibil imediat`,
    price: 50 + Math.floor(Math.random() * 100),
    priceWeek: 300 + Math.floor(Math.random() * 200),
    priceMonth: 1000 + Math.floor(Math.random() * 500),
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
      "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=80",
    ],
    location: "București",
    categoryId: 1,
    subcategoryId: "1-1",
    features: ["Stare excelentă", "Accesorii incluse", "Livrare disponibilă"],
    owner: {
      name: "Proprietar Verificat",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
      rating: 4.5,
      reviewCount: 12,
      responseTime: "< 2 ore",
      responseRate: 95,
      memberSince: "2023",
      verified: true,
    },
    reviews: [
      {
        id: "r1",
        userName: "Client Mulțumit",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
        rating: 5,
        comment: "Experiență excelentă, recomand!",
        date: "2024-11-01",
      },
    ],
  };
};

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProduct(id || "1");
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Get category and subcategory for breadcrumbs
  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === product.subcategoryId);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!startDate || (startDate && endDate)) {
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
    if (startDate && endDate) {
      return differenceInDays(endDate, startDate) + 1;
    }
    return 0;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    if (rentalDays === 0) return 0;
    if (rentalDays >= 30) {
      return Math.ceil(rentalDays / 30) * product.priceMonth;
    }
    if (rentalDays >= 7) {
      const weeks = Math.floor(rentalDays / 7);
      const extraDays = rentalDays % 7;
      return weeks * product.priceWeek + extraDays * product.price;
    }
    return rentalDays * product.price;
  }, [rentalDays, product]);

  const displayedReviews = showAllReviews ? product.reviews : product.reviews.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/categorii" className="hover:text-primary">Toate categoriile</Link>
          <ChevronRight className="h-4 w-4" />
          {category && (
            <>
              <Link to={`/categorie/${category.id}`} className="hover:text-primary">{category.name}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          {subcategory && (
            <>
              <Link to={`/subcategorie/${subcategory.id}`} className="hover:text-primary">{subcategory.name}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <div className="aspect-[4/3]">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
              
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentImageIndex ? "bg-primary" : "bg-background/60"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Owner Info Card */}
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
                      {product.owner.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          Verificat
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.owner.rating}</span>
                      <span className="text-muted-foreground">({product.owner.reviewCount} recenzii)</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Membru din {product.owner.memberSince}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Trimite mesaj
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Răspunde în {product.owner.responseTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>Rată răspuns: {product.owner.responseRate}%</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-foreground">Închirierea este asigurată</span>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{product.location}</span>
              </div>
              <div className="mt-4 aspect-video rounded-lg bg-muted">
                {/* Placeholder for map */}
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Hartă locație
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Descriere</h2>
              <div className="whitespace-pre-line text-muted-foreground">
                {product.longDescription}
              </div>
              
              {product.features.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h3 className="mb-3 font-medium text-foreground">Caracteristici</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Recenzii ({product.reviews.length})
                </h2>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.owner.rating}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.date), "d MMMM yyyy", { locale: ro })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
              
              {product.reviews.length > 3 && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? "Arată mai puține" : `Arată toate ${product.reviews.length} recenzii`}
                </Button>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Politica de anulare</h2>
              <p className="text-muted-foreground">
                Anulare gratuită cu până la 48 de ore înainte de începerea perioadei de închiriere. 
                Pentru anulări cu mai puțin de 48 de ore înainte, se va reține 50% din valoarea rezervării.
              </p>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Pricing Card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="font-heading text-xl font-bold text-foreground">{product.title}</h1>
                
                <div className="mt-4">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => isBefore(date, new Date())}
                    className="rounded-lg border"
                    modifiers={{
                      selected: (date) => {
                        if (startDate && endDate) {
                          return (
                            isSameDay(date, startDate) ||
                            isSameDay(date, endDate) ||
                            (isAfter(date, startDate) && isBefore(date, endDate))
                          );
                        }
                        return startDate ? isSameDay(date, startDate) : false;
                      },
                    }}
                    modifiersStyles={{
                      selected: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
                    }}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ridicare</span>
                    <span className="font-medium text-foreground">
                      {startDate ? format(startDate, "d MMMM yyyy", { locale: ro }) : "Selectează data"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Returnare</span>
                    <span className="font-medium text-foreground">
                      {endDate ? format(endDate, "d MMMM yyyy", { locale: ro }) : "Selectează data"}
                    </span>
                  </div>
                  {(startDate || endDate) && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearDates}>
                      Șterge datele
                    </Button>
                  )}
                </div>

                <Separator className="my-4" />

                {rentalDays > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{rentalDays} zile × {product.price} lei</span>
                      <span className="font-medium text-foreground">{totalPrice} lei</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">{totalPrice} lei</span>
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg" disabled={!startDate || !endDate}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Trimite cererea
                </Button>
                
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Nu vei fi taxat încă. Vei primi confirmarea de la proprietar.
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-3 font-semibold text-foreground">Prețuri</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per zi</span>
                    <span className="font-medium text-foreground">{product.price} lei</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per săptămână</span>
                    <span className="font-medium text-foreground">{product.priceWeek} lei</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per lună</span>
                    <span className="font-medium text-foreground">{product.priceMonth} lei</span>
                  </div>
                </div>
              </div>

              {/* Report */}
              <button className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Flag className="h-4 w-4" />
                Raportează anunțul
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;