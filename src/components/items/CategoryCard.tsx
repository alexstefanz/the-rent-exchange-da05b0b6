import { Link } from "react-router-dom";
import { Category } from "@/data/categories";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  // Use the first subcategory image as background
  const backgroundImage = category.subcategories[0]?.image || "";
  
  return (
    <Link
      to={`/categorie/${category.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: "15px" }}
    >
      {/* Background Image */}
      <img
        src={backgroundImage}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* Dark Overlay 30% */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Text Content - Centered with shadow */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <h3 
          className="text-center font-heading text-xl font-bold text-white drop-shadow-lg"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {category.name}
        </h3>
        <p 
          className="mt-2 text-center text-sm text-white/90"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
        >
          {category.subcategories.length} subcategorii
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
