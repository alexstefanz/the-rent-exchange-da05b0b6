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
import { Heart, Star, Search, List, LayoutGrid, ChevronRight, Check } from "lucide-react";
import { mockItems } from "@/data/mockItems";
import { categories } from "@/data/categories";
import { getUserById, mockUsers } from "@/data/mockUsers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 6;

const UserProfile = () => {
  const { id } = useParams();
  const user = getUserById(id || "user-1") || mockUsers[0];
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Filter items by user (all items belong to this user now)
  const userItems = useMemo(() => {
    let items = mockItems.filter(item => item.owner.id === id || item.owner.id === "user-1");

    // Filter by search
    if (searchQuery) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      items = items.filter((item) => item.subcategoryId === selectedSubcategory);
    }

    // Sort items
    switch (sortBy) {
      case "expensive":
        items = [...items].sort((a, b) => b.price - a.price);
        break;
      case "cheap":
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case "new":
      default:
        // Keep original order (newest first)
        break;
    }

    return items;
  }, [searchQuery, sortBy, selectedCategory, selectedSubcategory]);

  // Get all user items for counts
  const allUserItems = useMemo(() => {
    return mockItems.filter(item => item.owner.id === id || item.owner.id === "user-1");
  }, [id]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    allUserItems.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }, [allUserItems]);

  // Get subcategory counts for expanded category
  const subcategoryCounts = useMemo(() => {
    if (!expandedCategory) return {};
    const counts: Record<string, number> = {};
    allUserItems
      .filter((item) => item.categoryId === expandedCategory)
      .forEach((item) => {
        counts[item.subcategoryId] = (counts[item.subcategoryId] || 0) + 1;
      });
    return counts;
  }, [expandedCategory, allUserItems]);

  // Pagination
  const totalPages = Math.ceil(userItems.length / ITEMS_PER_PAGE);
  const paginatedItems = userItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryClick = (categoryId: number) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setExpandedCategory(categoryId);
      setSelectedCategory(categoryId);
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
    (cat) => categoryCounts[cat.id] > 0
  );

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
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground">
                    {user.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#57be6a] font-semibold">
                      {user.rating} / 5
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.floor(user.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <a
                    href="#ratings"
                    className="text-sm text-primary hover:underline"
                  >
                    ({user.reviewCount} de ratinguri)
                  </a>
                </div>
              </div>

              {/* Member Info */}
              <div className="text-sm text-muted-foreground md:text-right">
                <p>Pe RentNow din {user.memberSince}</p>
                <p>Activ: {user.lastActive}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  Distribuie
                </Button>
                <Button
                  variant="outline"
                  className={`gap-2 ${isFavorite ? "text-red-500 border-red-500" : ""}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-red-500" : ""}`}
                  />
                  Salvează ca favorit
                </Button>
              </div>
            </div>
          </div>
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
                Am găsit {userItems.length} rezultate pentru tine
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
                  {allUserItems.length}
                </span>
              </button>

              {/* Categories List */}
              <div className="space-y-1 mt-2">
                {availableCategories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors ${
                        selectedCategory === category.id
                          ? "font-semibold text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {selectedCategory === category.id && !selectedSubcategory && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {category.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          {categoryCounts[category.id]}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedCategory === category.id ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Subcategories */}
                    {expandedCategory === category.id && (
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
                        src={item.images[0]}
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
                              {item.price} lei
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
                          {item.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          29 decembrie 2025
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
                          src={item.images[0]}
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
                          {item.price} lei
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          29 decembrie 2025
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
