import { Link } from "react-router-dom";
import { SearchX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { uxCopy } from "@/data/uxCopy";

interface EmptySearchStateProps {
  searchQuery?: string;
  type?: "products" | "users";
}

const EmptySearchState = ({ searchQuery, type = "products" }: EmptySearchStateProps) => {
  // Get 4 popular categories for suggestions
  const popularCategories = categories.slice(0, 4);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">
        {uxCopy.search.noResults}
      </h3>
      
      <p className="mb-6 max-w-md text-muted-foreground">
        {searchQuery 
          ? `Nu am găsit ${type === "products" ? "produse" : "utilizatori"} pentru "${searchQuery}". ${uxCopy.search.noResultsSubtitle}`
          : `Nu există ${type === "products" ? "produse" : "utilizatori"} disponibile momentan.`
        }
      </p>

      {type === "products" && (
        <>
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-foreground">
              {uxCopy.search.suggestions}:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categorie/${category.id}`}
                  className="rounded-full bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <Button asChild>
            <Link to="/categorii">
              Explorează toate categoriile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};

export default EmptySearchState;
