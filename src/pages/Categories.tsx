import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/items/CategoryCard";
import { categories } from "@/data/categories";

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Toate Categoriile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explorează toate cele 22 de categorii de produse pentru închiriat
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută categorii sau subcategorii..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {filteredCategories.map((category, index) => (
            <div
              key={category.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
            >
              <CategoryCard category={category} />
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Nu am găsit categorii care să corespundă căutării tale.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
