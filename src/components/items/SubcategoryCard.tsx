import { Link } from "react-router-dom";
import { getSubcategoryIcon } from "@/data/subcategoryIcons";

interface SubcategoryCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  categoryId: number;
}

const SubcategoryCard = ({ id, name }: SubcategoryCardProps) => {
  const Icon = getSubcategoryIcon(id);
  
  return (
    <Link
      to={`/subcategorie/${id}`}
      className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-center font-medium text-foreground">
        {name}
      </span>
    </Link>
  );
};

export default SubcategoryCard;
