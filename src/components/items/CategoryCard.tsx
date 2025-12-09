import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Category } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const Icon = getCategoryIcon(category.id);
  
  return (
    <Link
      to={`/categorie/${category.id}`}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {category.id}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {category.subcategories.length} subcategorii disponibile
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {category.subcategories.slice(0, 3).map((sub) => (
            <span
              key={sub.id}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {sub.name}
            </span>
          ))}
          {category.subcategories.length > 3 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              +{category.subcategories.length - 3} altele
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
