import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories, getAllSubcategories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";

// Mock products for subcategories
const generateMockProducts = (subcategoryName: string, subcategoryId: string) => {
  const products = [
    {
      id: `${subcategoryId}-p1`,
      title: `${subcategoryName} - Model Premium`,
      price: 50,
      location: "București",
      rating: 4.8,
      reviewCount: 23,
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80",
    },
    {
      id: `${subcategoryId}-p2`,
      title: `${subcategoryName} - Standard`,
      price: 35,
      location: "Cluj-Napoca",
      rating: 4.5,
      reviewCount: 15,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    },
    {
      id: `${subcategoryId}-p3`,
      title: `${subcategoryName} - Economic`,
      price: 25,
      location: "Timișoara",
      rating: 4.6,
      reviewCount: 31,
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80",
    },
    {
      id: `${subcategoryId}-p4`,
      title: `${subcategoryName} - Profesional`,
      price: 75,
      location: "Iași",
      rating: 4.9,
      reviewCount: 42,
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
    },
    {
      id: `${subcategoryId}-p5`,
      title: `${subcategoryName} - Set Complet`,
      price: 100,
      location: "Brașov",
      rating: 4.7,
      reviewCount: 18,
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80",
    },
    {
      id: `${subcategoryId}-p6`,
      title: `${subcategoryName} - Nou 2024`,
      price: 60,
      location: "Constanța",
      rating: 5.0,
      reviewCount: 8,
      image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80",
    },
  ];
  return products;
};

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

  const products = generateMockProducts(subcategory.name, subcategory.id);
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
                  src={product.image}
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
                    <span className="text-sm text-muted-foreground"> / zi</span>
                  </div>
                  <Button size="sm">Vezi Detalii</Button>
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
