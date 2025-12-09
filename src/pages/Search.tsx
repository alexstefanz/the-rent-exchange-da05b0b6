import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/items/CategoryCard";
import SubcategoryCard from "@/components/items/SubcategoryCard";
import { searchCategories, categories } from "@/data/categories";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { matchingCategories, matchingSubcategories } = searchQuery
    ? searchCategories(searchQuery)
    : { matchingCategories: categories, matchingSubcategories: [] };

  const hasResults =
    matchingCategories.length > 0 || matchingSubcategories.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Caută Produse
          </h1>
          <p className="mt-2 text-muted-foreground">
            Găsește rapid categoria sau produsul de care ai nevoie
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-10">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută categorii sau produse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-14 text-lg"
            />
          </div>
        </div>

        {/* Results */}
        {searchQuery && hasResults && (
          <>
            {/* Matching Categories */}
            {matchingCategories.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                  Categorii ({matchingCategories.length})
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {matchingCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </section>
            )}

            {/* Matching Subcategories */}
            {matchingSubcategories.length > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                  Produse ({matchingSubcategories.length})
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {matchingSubcategories.map((subcategory) => (
                    <SubcategoryCard
                      key={subcategory.id}
                      id={subcategory.id}
                      name={subcategory.name}
                      description={subcategory.description}
                      image={subcategory.image}
                      categoryId={subcategory.categoryId}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* No Query - Show All Categories */}
        {!searchQuery && (
          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
              Toate Categoriile
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {searchQuery && !hasResults && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Nu am găsit rezultate pentru "{searchQuery}"
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Încearcă să cauți alt termen sau răsfoiește categoriile
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Search;
