import { Link } from "react-router-dom";

interface SubcategoryCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  categoryId: number;
}

const SubcategoryCard = ({ id, name, description, image, categoryId }: SubcategoryCardProps) => {
  return (
    <Link
      to={`/subcategorie/${id}`}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-heading text-lg font-semibold text-white group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="mt-1 text-sm text-white/80 line-clamp-2">
          {description}
        </p>
      </div>
      
      <div className="absolute top-3 right-3">
        <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
          Închiriază
        </span>
      </div>
    </Link>
  );
};

export default SubcategoryCard;
