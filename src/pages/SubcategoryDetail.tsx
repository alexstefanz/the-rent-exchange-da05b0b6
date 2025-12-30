import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Star, Grid3X3, List, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories, getAllSubcategories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { getItemsBySubcategory, getItemsByCategory, mockItems } from "@/data/mockItems";
import { judete } from "@/data/romaniaLocations";

const SubcategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedSubcategory, setSelectedSubcategory] = useState(id || "");
  const [selectedJudet, setSelectedJudet] = useState("");
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");

  const allSubcategories = getAllSubcategories();
  const subcategory = allSubcategories.find((sub) => sub.id === id);
  const category = subcategory
    ? categories.find((cat) => cat.id === subcategory.categoryId)
    : null;

  const categorySubcategories = category
    ? allSubcategories.filter((sub) => sub.categoryId === category.id)
    : [];

  const selectedJudetData = judete.find((j) => j.name === selectedJudet);
  const localitati = selectedJudetData?.localitati || [];

  // Get products for this subcategory
  let products = getItemsBySubcategory(subcategory?.id || "");
  if (products.length === 0 && category) {
    products = getItemsByCategory(category.id);
  }
  if (products.length === 0) {
    products = mockItems.slice(0, 8);
  }

  // Apply sorting
  const sortedProducts = useMemo(() => {
    if (!sortOrder) return products;
    return [...products].sort((a, b) => {
      if (sortOrder === "asc") return a.price - b.price;
      return b.price - a.price;
    });
  }, [products, sortOrder]);

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    if (value && value !== "all") {
      navigate(`/subcategorie/${value}`);
    }
  };

  if (!subcategory || !category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Subcategoria nu a fost găsită
          </h1>
          <Button asChild className="mt-4">
            <Link to="/categorii">Înapoi la Categorii</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = getCategoryIcon(category.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Breadcrumb */}
        <Link
          to={`/categorie/${category.id}`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Înapoi la {category.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {category.name}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {subcategory.name}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {subcategory.description}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {sortedProducts.length} produse disponibile pentru închiriere
          </p>
        </div>

        {/* Filter Form */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-card p-4 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
          {/* Subcategory select */}
          <div className="flex flex-1 items-center gap-2 px-4">
            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedSubcategory}
              onValueChange={handleSubcategoryChange}
            >
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder="Toate subcategoriile" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">Toate subcategoriile</SelectItem>
                {categorySubcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-border md:block" />

          {/* Judet select */}
          <div className="flex flex-1 items-center gap-2 px-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedJudet}
              onValueChange={(value) => {
                setSelectedJudet(value);
                setSelectedLocalitate("");
              }}
            >
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder="Toată țara" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">Toată țara</SelectItem>
                {judete.map((judet) => (
                  <SelectItem key={judet.name} value={judet.name}>
                    {judet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Localitate select */}
          {selectedJudet && selectedJudet !== "all" && (
            <>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-4">
                <Select
                  value={selectedLocalitate}
                  onValueChange={setSelectedLocalitate}
                >
                  <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                    <div className="flex items-center justify-between w-full">
                      <SelectValue placeholder="Selectează localitatea" />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-card z-50">
                    <SelectItem value="all">Toate localitățile</SelectItem>
                    {localitati.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Sort and View Options */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc" | "") => setSortOrder(value)}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Sortează după preț" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="asc">Preț: Ieftin → Scump</SelectItem>
                <SelectItem value="desc">Preț: Scump → Ieftin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <Button
              variant={viewMode === "gallery" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("gallery")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid / List */}
        {viewMode === "gallery" ? (
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden transition-all hover:shadow-card-hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {product.location}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {product.rating}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount} recenzii)
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-heading text-xl font-bold text-primary">
                        {product.price} RON
                      </span>
                      <span className="text-sm text-muted-foreground"> / {product.priceUnit}</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link to={`/produs/${product.id}`}>Vezi</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden transition-all hover:shadow-card-hover"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative aspect-[4/3] sm:aspect-square sm:w-48 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="flex-1 p-4">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {product.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {product.rating}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviewCount} recenzii)
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xl font-bold text-primary">
                          {product.price} RON
                        </span>
                        <span className="text-sm text-muted-foreground"> / {product.priceUnit}</span>
                      </div>
                      <Button size="sm" asChild>
                        <Link to={`/produs/${product.id}`}>Vezi Detalii</Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryDetail;
