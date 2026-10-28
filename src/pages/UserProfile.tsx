import { IdentityVerifiedBadge } from "@/components/trust/IdentityVerifiedBadge";
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Star, Search, List, LayoutGrid, ChevronRight, Check, Loader2, Calendar, Package, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/categories";
import { getProductUrl } from "@/lib/slugUtils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { calculateClientPrice, Product } from "@/features/products/productsApi";
import { addFavoriteUser, removeFavoriteUser } from "@/features/profile/favoritesApi";
import { usePublicUserProducts } from "@/hooks/queries/useProducts";
import { usePublicProfile, useUserStatistics, useUserReviews, useIsUserFavorite } from "@/hooks/queries/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayTitle } from "@/lib/productI18n";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";

const ITEMS_PER_PAGE = 6;

const UserProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  // React Query hooks for data fetching
  const { data: profile, isLoading: profileLoading, error: profileError } = usePublicProfile(id);
  const { data: products = [] } = usePublicUserProducts(id);
  const { data: statistics, isLoading: statsLoading } = useUserStatistics(id);
  const { data: reviews = [] } = useUserReviews(id);
  const { data: isFavorite = false } = useIsUserFavorite(id, user?.id);
  
  // Local UI state
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const isLoading = profileLoading;

  const profileName = (profile as any)?.full_name || "Utilizator";
  const profileAvatar = (profile as any)?.avatar_url || undefined;
  usePageSeo({
    title: language === "en"
      ? `${profileName} — listings on Rentli`
      : `${profileName} — anunțuri pe Rentli`,
    description: language === "en"
      ? `Discover items listed by ${profileName} on Rentli.`
      : `Descoperă produsele publicate de ${profileName} pe Rentli.`,
    image: profileAvatar,
    type: "article",
    jsonLd: profile ? {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: profileName,
        image: profileAvatar,
      },
    } : null,
  });

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error("Trebuie să fii autentificat pentru a salva la favorite.");
      return;
    }

    if (!id || user.id === id) {
      return;
    }

    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavoriteUser(id);
        toast.success("Utilizator eliminat din favorite.");
      } else {
        await addFavoriteUser(id);
        toast.success("Utilizator salvat la favorite!");
      }
      // Invalidate the favorites query to refresh
      queryClient.invalidateQueries({ queryKey: ["is-favorite", id, user.id] });
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("A apărut o eroare. Încearcă din nou.");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let items = [...products];

    if (searchQuery) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (selectedSubcategory) {
      items = items.filter((item) => item.subcategory === selectedSubcategory);
    }

    switch (sortBy) {
      case "expensive":
        items = items.sort((a, b) => 
          calculateClientPrice(b.daily_price_owner, b.platform_fee_percent) - 
          calculateClientPrice(a.daily_price_owner, a.platform_fee_percent)
        );
        break;
      case "cheap":
        items = items.sort((a, b) => 
          calculateClientPrice(a.daily_price_owner, a.platform_fee_percent) - 
          calculateClientPrice(b.daily_price_owner, b.platform_fee_percent)
        );
        break;
      case "new":
      default:
        break;
    }

    return items;
  }, [products, searchQuery, sortBy, selectedCategory, selectedSubcategory]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((item) => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Get subcategory counts for expanded category
  const subcategoryCounts = useMemo(() => {
    if (!expandedCategory) return {};
    const counts: Record<string, number> = {};
    products
      .filter((item) => item.category === expandedCategory)
      .forEach((item) => {
        if (item.subcategory) {
          counts[item.subcategory] = (counts[item.subcategory] || 0) + 1;
        }
      });
    return counts;
  }, [expandedCategory, products]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryClick = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setExpandedCategory(categoryName);
      setSelectedCategory(categoryName);
      setSelectedSubcategory(null);
    }
    setCurrentPage(1);
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentPage(1);
  };

  const handleAllItems = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setExpandedCategory(null);
    setCurrentPage(1);
  };

  const availableCategories = categories.filter(
    (cat) => categoryCounts[cat.name] > 0
  );

  const getImageUrl = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "/placeholder.svg";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Se încarcă profilul...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Profil negăsit
            </h1>
            <p className="text-muted-foreground mb-4">
              Utilizatorul nu a fost găsit sau contul a fost dezactivat.
            </p>
            <Button asChild>
              <Link to="/">Înapoi la pagina principală</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* User Summary Section */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.full_name || "Utilizator"}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-heading font-bold text-foreground">
                      {profile.full_name || "Utilizator"}
                    </h1>
                    <IdentityVerifiedBadge userId={id} />
                  </div>
                  {/* Rating display */}
                  <div className="flex items-center gap-2 mt-1">
                    {statistics && statistics.reviews_count > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">
                            {statistics.average_rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          ({statistics.reviews_count} {statistics.reviews_count === 1 ? "recenzie" : "recenzii"})
                        </span>
                      </>
                    ) : (
                      (() => {
                        const isNew = statistics?.member_since && 
                          (new Date().getTime() - new Date(statistics.member_since).getTime()) < 90 * 24 * 60 * 60 * 1000;
                        return isNew ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Membru nou</Badge>
                        ) : (
                          <Badge variant="secondary">Membru standard</Badge>
                        );
                      })()
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {products.length} {products.length === 1 ? "anunț activ" : "anunțuri active"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={async () => {
                  const shareData = {
                    title: profile.full_name || "Profil utilizator",
                    url: window.location.href,
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copiat în clipboard!");
                    }
                  } catch (err) {
                    if ((err as Error).name !== "AbortError") {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copiat în clipboard!");
                    }
                  }
                }}>
                  Distribuie
                </Button>
                {user && user.id !== id && (
                  <Button
                    variant="outline"
                    className={`gap-2 ${isFavorite ? "text-red-500 border-red-500" : ""}`}
                    onClick={handleFavoriteToggle}
                    disabled={isFavoriteLoading}
                  >
                    {isFavoriteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500" : ""}`} />
                    )}
                    {isFavorite ? "Salvat" : "Salvează ca favorit"}
                  </Button>
                )}
              </div>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produse</p>
                      <p className="font-semibold text-foreground">
                        {statistics && statistics.products_count > 0 ? statistics.products_count : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating mediu</p>
                      <p className="font-semibold text-foreground">
                        {statistics && statistics.reviews_count > 0 ? statistics.average_rating.toFixed(1) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recenzii</p>
                      <p className="font-semibold text-foreground">
                        {statistics && statistics.reviews_count > 0 ? statistics.reviews_count : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Membru din</p>
                      <p className="font-semibold text-foreground">
                        {statistics?.member_since ? formatDate(statistics.member_since) : "—"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-8">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-end gap-3 mb-6">
            {/* Search */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter Dropdown */}
            {availableCategories.length > 0 && (
              <Select
                value={selectedCategory || "all"}
                onValueChange={(val) => {
                  if (val === "all") {
                    handleAllItems();
                  } else {
                    setSelectedCategory(val);
                    setSelectedSubcategory(null);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filtrează" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate anunțurile ({products.length})</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name} ({categoryCounts[cat.name]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Cele mai noi</SelectItem>
                <SelectItem value="expensive">Preț descrescător</SelectItem>
                <SelectItem value="cheap">Preț crescător</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="w-auto ml-auto">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Products Grid/List */}
          <div>
              {paginatedItems.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedItems.map((item) => (
                      <Link
                        key={item.id}
                        to={getProductUrl(item)}
                        className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={getImageUrl(item)}
                            alt={getDisplayTitle(item, language)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-foreground line-clamp-2">
                            {getDisplayTitle(item, language)}
                          </h3>
                          <p className="text-primary font-bold mt-2">
                            {calculateClientPrice(item.daily_price_owner, item.platform_fee_percent)} {language === "en" ? "lei/day" : "lei/zi"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.location_city}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedItems.map((item) => (
                      <Link
                        key={item.id}
                        to={getProductUrl(item)}
                        className="flex gap-4 bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow p-4"
                      >
                        <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(item)}
                            alt={getDisplayTitle(item, language)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground line-clamp-2">
                            {getDisplayTitle(item, language)}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-primary font-bold">
                              {calculateClientPrice(item.daily_price_owner, item.platform_fee_percent)} {language === "en" ? "lei/day" : "lei/zi"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.location_city}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {products.length === 0
                      ? (language === "en" ? "This user has no published listings at the moment." : "Acest utilizator nu are anunțuri publicate momentan.")
                      : (language === "en" ? "No products found." : "Nu s-au găsit produse.")}
                  </p>
                </div>
              )}
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-xl font-heading font-bold text-foreground mb-6">
                Recenzii ({reviews.length})
              </h2>
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.reviewer?.avatar_url || "/placeholder.svg"}
                        alt={review.reviewer?.full_name || "Utilizator"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">
                            {review.reviewer?.full_name || "Utilizator anonim"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {reviews.length > 3 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? "Arată mai puține" : `Vezi toate recenziile (${reviews.length})`}
                </Button>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
