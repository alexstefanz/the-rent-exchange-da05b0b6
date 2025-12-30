import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SubcategoryCard from "@/components/items/SubcategoryCard";
import { getCategoryById } from "@/data/categories";

const CategoryDetail = () => {
  const { id } = useParams();
  const category = getCategoryById(Number(id));

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Categoria nu a fost găsită
          </h1>
          <Button asChild className="mt-4">
            <Link to="/categorii">Înapoi la Categorii</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Breadcrumb */}
        <Link
          to="/categorii"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Înapoi la Categorii
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <span className="hidden text-5xl md:block">{category.icon}</span>
            <div className="w-full">
              <div className="flex items-center gap-3">
                <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground md:flex">
                  {category.id}
                </span>
                <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                  {category.name}
                </h1>
              </div>
              <p className="mt-2 text-muted-foreground">
                {category.subcategories.length} subcategorii disponibile pentru închiriat
              </p>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {category.subcategories.map((subcategory, index) => (
            <div
              key={subcategory.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
            >
              <SubcategoryCard
                id={subcategory.id}
                name={subcategory.name}
                description={subcategory.description}
                image={subcategory.image}
                categoryId={category.id}
              />
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryDetail;
