import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories, getAllSubcategories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { getItemsBySubcategory, getItemsByCategory, mockItems } from "@/data/mockItems";

const SubcategoryDetail = () => {
  const { id } = useParams();
  
  const allSubcategories = getAllSubcategories();
  const subcategory = allSubcategories.find((sub) => sub.id === id);
  const category = subcategory
    ? categories.find((cat) => cat.id === subcategory.categoryId)
    : null;

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

  // Get products for this subcategory, fallback to category products if none found
  let products = getItemsBySubcategory(subcategory.id);
  if (products.length === 0) {
    products = getItemsByCategory(category.id);
  }
  // If still no products, show some random products as placeholders
  if (products.length === 0) {
    products = mockItems.slice(0, 6);
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
            {products.length} produse disponibile pentru închiriere
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
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
                    <Link to={`/produs/${product.id}`}>Vezi Detalii</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryDetail;
