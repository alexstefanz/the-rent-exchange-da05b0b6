import { useState, useMemo, useEffect } from "react";
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
import { Heart, Star, Search, List, LayoutGrid, ChevronRight, Check, Loader2, Share2 } from "lucide-react";
import { categories } from "@/data/categories";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  getPublicProfile, 
  getUserStatistics, 
  getUserReviews,
  isUserFavorite,
  addUserToFavorites,
  removeUserFromFavorites,
  UserStatistics,
  UserReview
} from "@/features/profile/profileApi";
import { getPublicUserProducts, Product, calculateClientPrice } from "@/features/products/productsApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import UserStatsCard from "@/components/profile/UserStatsCard";
import UserReviewsList from "@/components/profile/UserReviewsList";

const ITEMS_PER_PAGE = 6;

interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const UserProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  // State for real data
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch profile and products on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID utilizator lipsă");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [profileData, productsData, statsData, reviewsData] = await Promise.all([
          getPublicProfile(id),
          getPublicUserProducts(id),
          getUserStatistics(id),
          getUserReviews(id)
        ]);

        if (!profileData) {
          setError("Profilul nu a fost găsit sau utilizatorul nu are anunțuri active.");
          setIsLoading(false);
          return;
        }

        setProfile(profileData);
        setProducts(productsData);
        setStatistics(statsData);
        setReviews(reviewsData);

        // Check if user is in favorites (if logged in)
        if (user) {
          const favoriteStatus = await isUserFavorite(id);
          setIsFavorite(favoriteStatus);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("A apărut o eroare la încărcarea profilului.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let items = [...products];

    // Filter by search
    if (searchQuery) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      items = items.filter((item) => item.subcategory === selectedSubcategory);
    }

    // Sort items
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
        // Already sorted by created_at desc from API
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

  // Helper function to get image URL
  const getImageUrl = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "/placeholder.svg";
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

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
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Profil negăsit
            </h1>
            <p className="text-muted-foreground mb-4">
              {error || "Utilizatorul nu a fost găsit sau nu are anunțuri active."}
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

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error("Trebuie să fii autentificat pentru a salva la favorite.");
      return;
    }

    if (!id || id === user.id) {
      return;
    }

    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        const success = await removeUserFromFavorites(id);
        if (success) {
          setIsFavorite(false);
          toast.success("Utilizator eliminat din favorite");
        }
      } else {
        const success = await addUserToFavorites(id);
        if (success) {
          setIsFavorite(true);
          toast.success("Utilizator adăugat la favorite");
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("A apărut o eroare");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: profile?.full_name || "Profil utilizator",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiat în clipboard");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

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
                  <h1 className="text-2xl font-heading font-bold text-foreground">
                    {profile.full_name || "Utilizator"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {statistics && statistics.reviews_count > 0 ? (
                      <>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-foreground">
                          {statistics.average_rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({statistics.reviews_count} recenzii)
                        </span>
                      </>
                    ) : (
                      <span className="text-[#57be6a] font-semibold">Nou</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {products.length} {products.length === 1 ? "anunț activ" : "anunțuri active"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Distribuie
                </Button>
                {user && id !== user.id && (
                  <Button
                    variant="outline"
                    className={`gap-2 ${isFavorite ? "text-red-500 border-red-500" : ""}`}
                    onClick={handleFavoriteToggle}
                    disabled={isFavoriteLoading}
                  >
                    <Heart
                      className={`h-4 w-4 ${isFavorite ? "fill-red-500" : ""}`}
                    />
                    {isFavorite ? "Salvat" : "Salvează"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="container mx-auto px-4 py-6">
          <UserStatsCard
            productsCount={statistics?.products_count || products.length}
            memberSince={statistics?.member_since || null}
            averageRating={statistics?.average_rating || 0}
            reviewsCount={statistics?.reviews_count || 0}
          />
        </div>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-8">
          {/* Search and Sort Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            {/* Search */}
            <div className="w-full lg:w-auto">
              <p className="text-sm text-muted-foreground mb-2">
                Caută pe această pagină
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-full lg:w-64"
                />
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Sortează după
                </p>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Noi</SelectItem>
                    <SelectItem value="expensive">Scumpe</SelectItem>
                    <SelectItem value="cheap">Ieftine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 pt-6">
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
                <div className="pt-6">
                  <Pagination>
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
                </div>
              )}
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Filters */}
            <aside className="w-full lg:w-64 shrink-0">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                Filtrează anunțurile
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Am găsit {filteredProducts.length} rezultate pentru tine
              </p>
              <p className="text-sm font-medium text-foreground mb-3">
                Categorii
              </p>

              {/* All Items */}
              <button
                onClick={handleAllItems}
                className={`flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors ${
                  !selectedCategory ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {!selectedCategory && <Check className="h-4 w-4 text-primary" />}
                  Toate anunțurile
                </span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </button>

              {/* Categories List */}
              <div className="space-y-1 mt-2">
                {availableCategories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => handleCategoryClick(category.name)}
                      className={`flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors ${
                        selectedCategory === category.name
                          ? "font-semibold text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {selectedCategory === category.name && !selectedSubcategory && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {category.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          {categoryCounts[category.name]}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedCategory === category.name ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Subcategories */}
                    {expandedCategory === category.name && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                        {category.subcategories
                          .filter((sub) => subcategoryCounts[sub.id])
                          .map((subcategory) => (
                            <button
                              key={subcategory.id}
                              onClick={() => handleSubcategoryClick(subcategory.id)}
                              className={`flex items-center justify-between w-full py-1.5 text-left text-sm hover:text-primary transition-colors ${
                                selectedSubcategory === subcategory.id
                                  ? "font-semibold text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {selectedSubcategory === subcategory.id && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                                {subcategory.name}
                              </span>
                              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                                {subcategoryCounts[subcategory.id]}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>

            {/* Products Grid/List */}
            <div className="flex-1">
              {paginatedItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nu am găsit anunțuri care să corespundă criteriilor tale.
                  </p>
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-4">
                  {paginatedItems.map((item) => (
                    <Link
                      key={item.id}
                      to={`/produs/${item.id}`}
                      className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <img
                        src={getImageUrl(item)}
                        alt={item.title}
                        className="w-40 h-28 object-cover rounded-md shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-xl font-bold text-[#57be6a] mt-1">
                              {calculateClientPrice(item.daily_price_owner, item.platform_fee_percent)} lei
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.location_city || item.location_country || "România"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedItems.map((item) => (
                    <Link
                      key={item.id}
                      to={`/produs/${item.id}`}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative">
                        <img
                          src={getImageUrl(item)}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xl font-bold text-[#57be6a] mt-1">
                          {calculateClientPrice(item.daily_price_owner, item.platform_fee_percent)} lei
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.location_city || item.location_country || "România"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="container mx-auto px-4 pb-8">
          <UserReviewsList reviews={reviews} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
