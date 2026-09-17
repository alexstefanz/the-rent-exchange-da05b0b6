import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Grid3X3, List, ChevronDown, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { categories, getAllSubcategories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { judete } from "@/data/romaniaLocations";
import { getProducts, Product } from "@/features/products/productsApi";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import { truncateForMeta, META_TITLE_MAX, META_DESCRIPTION_MAX } from "@/lib/seoText";
import CategorySeoContent from "@/components/seo/CategorySeoContent";

const SubcategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const copy = useUxCopy();
  const { language } = useLanguage();
  
  const [selectedSubcategory, setSelectedSubcategory] = useState(id || "");
  const [selectedJudet, setSelectedJudet] = useState("");
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const allSubcategories = getAllSubcategories();
  const subcategory = allSubcategories.find((sub) => sub.id === id);
  const category = subcategory
    ? categories.find((cat) => cat.id === subcategory.categoryId)
    : null;

  const categorySubcategories = category
    ? allSubcategories.filter((sub) => sub.categoryId === category.id)
    : [];

  const selectedJudetData = judete.find((j) => j.name === selectedJudet);
  const localitati = [...(selectedJudetData?.localitati || [])].sort((a, b) =>
    a.localeCompare(b, "ro", { sensitivity: "base" }),
  );

  const subcategoryId = subcategory?.id;
  const categoryName = category?.name;

  // Translated names
  const catDisplayName = category ? (language === "en" ? category.nameEn : category.name) : "";
  const subDisplayName = subcategory ? (language === "en" ? subcategory.nameEn : subcategory.name) : "";
  const subDisplayDesc = subcategory ? (language === "en" ? subcategory.descriptionEn : subcategory.description) : "";

  const subSeoDescription = subcategory
    ? truncateForMeta(
        language === "en"
          ? `${subDisplayDesc}. Rent ${subDisplayName.toLowerCase()} from verified people in Romania: secure payment and photo-documented handover.`
          : `${subDisplayDesc}. Închiriază ${subDisplayName.toLowerCase()} de la oameni verificați din România: plată securizată și predare documentată cu poze.`,
        META_DESCRIPTION_MAX,
      )
    : (language === "en" ? "Browse Rentli subcategories." : "Explorează subcategoriile Rentli.");

  usePageSeo({
    title: subcategory
      ? truncateForMeta(
          language === "en"
            ? `Rent ${subDisplayName} — ${catDisplayName}`
            : `Închiriere ${subDisplayName} — ${catDisplayName}`,
          META_TITLE_MAX - 9,
        ) + " | Rentli"
      : (language === "en" ? "Subcategory | Rentli" : "Subcategorie | Rentli"),
    description: subSeoDescription,
    jsonLd: subcategory && category ? {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: subDisplayName,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: language === "en" ? "Home" : "Acasă", item: "https://rentli.ro/" },
          { "@type": "ListItem", position: 2, name: language === "en" ? "Categories" : "Categorii", item: "https://rentli.ro/categorii" },
          { "@type": "ListItem", position: 3, name: catDisplayName, item: `https://rentli.ro/categorie/${category.slug}` },
          { "@type": "ListItem", position: 4, name: subDisplayName, item: `https://rentli.ro/subcategorie/${subcategory.id}` },
        ],
      },
    } : null,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!subcategoryId || !categoryName) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const data = await getProducts({
          subcategory: subcategoryId,
          location_city: selectedLocalitate && selectedLocalitate !== "all" ? selectedLocalitate : undefined,
        });
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally { setIsLoading(false); }
    };
    fetchProducts();
  }, [subcategoryId, categoryName, selectedLocalitate]);

  const sortedProducts = useMemo(() => {
    if (!sortOrder) return products;
    return [...products].sort((a, b) => {
      if (sortOrder === "asc") return a.daily_price_owner - b.daily_price_owner;
      return b.daily_price_owner - a.daily_price_owner;
    });
  }, [products, sortOrder]);

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    if (value && value !== "all") navigate(`/subcategorie/${value}`);
  };

  if (!subcategory || !category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {copy.categoryDetail.subcategoryNotFound}
          </h1>
          <Button asChild className="mt-4">
            <Link to="/categorii">{copy.categoryDetail.backToCategories}</Link>
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
        <Link
          to={`/categorie/${category.slug}`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {copy.categoryDetail.backTo(catDisplayName)}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{catDisplayName}</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{subDisplayName}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{subDisplayDesc}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {isLoading ? copy.categoryDetail.loading : copy.categoryDetail.productsAvailable(sortedProducts.length)}
          </p>
        </div>

        {/* Filter Form */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-card p-4 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
          <div className="flex flex-1 items-center gap-2 px-4">
            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedSubcategory} onValueChange={handleSubcategoryChange}>
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder={copy.categoryDetail.allSubcategories} />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">{copy.categoryDetail.allSubcategories}</SelectItem>
                {categorySubcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {language === "en" ? sub.nameEn : sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden h-8 w-px bg-border md:block" />

          <div className="flex flex-1 items-center gap-2 px-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedJudet} onValueChange={(value) => { setSelectedJudet(value); setSelectedLocalitate(""); }}>
              <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full">
                  <SelectValue placeholder={copy.categoryDetail.entireCountry} />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-card z-50">
                <SelectItem value="all">{copy.categoryDetail.entireCountry}</SelectItem>
                {judete.map((judet) => (
                  <SelectItem key={judet.name} value={judet.name}>{judet.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedJudet && selectedJudet !== "all" && (
            <>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-4">
                <Select value={selectedLocalitate} onValueChange={setSelectedLocalitate}>
                  <SelectTrigger className="w-full border-0 bg-transparent p-0 text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                    <div className="flex items-center justify-between w-full">
                      <SelectValue placeholder={copy.categoryDetail.selectCity} />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-card z-50">
                    <SelectItem value="all">{copy.categoryDetail.allCities}</SelectItem>
                    {localitati.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Sort and View Options */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc" | "") => setSortOrder(value)}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder={copy.categoryDetail.sortByPrice} />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="asc">{copy.categoryDetail.priceLowHigh}</SelectItem>
                <SelectItem value="desc">{copy.categoryDetail.priceHighLow}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <Button variant={viewMode === "gallery" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("gallery")} className="h-8 w-8 p-0">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && sortedProducts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">{copy.categoryDetail.noProducts}</p>
            <Button asChild className="mt-4">
              <Link to="/adauga-anunt">{copy.categoryDetail.addFirstProduct}</Link>
            </Button>
          </div>
        )}

        {!isLoading && sortedProducts.length > 0 && (
          viewMode === "gallery" ? (
            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="gallery" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="list" />
              ))}
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubcategoryDetail;
