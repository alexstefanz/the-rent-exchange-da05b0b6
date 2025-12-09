import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories, getAllSubcategories } from "@/data/categories";

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

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl">
            <img
              src={subcategory.image}
              alt={subcategory.name}
              className="h-full max-h-[500px] w-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {category.name}
              </span>
            </div>

            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              {subcategory.name}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              {subcategory.description}
            </p>

            {/* Placeholder Info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>Locație: Disponibil în toată România</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>Disponibilitate: Verifică calendarul</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-5 w-5" />
                    <span>Contact: După rezervare</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Placeholder */}
            <Card className="mt-4">
              <CardContent className="p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Preț de la</p>
                    <p className="font-heading text-3xl font-bold text-primary">
                      50 RON
                      <span className="text-base font-normal text-muted-foreground">
                        {" "}
                        / zi
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button className="w-full" size="lg">
                    Solicită Închiriere
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    Contactează Proprietarul
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryDetail;
