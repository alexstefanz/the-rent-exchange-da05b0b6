import { Link } from "react-router-dom";
import { getSubcategoryIcon } from "@/data/subcategoryIcons";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubcategoryCardProps {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  image: string;
  categoryId: number;
}

const SubcategoryCard = ({ id, name, nameEn }: SubcategoryCardProps) => {
  const Icon = getSubcategoryIcon(id);
  const { language } = useLanguage();
  const displayName = language === "en" && nameEn ? nameEn : name;
  
  return (
    <Link
      to={`/subcategorie/${id}`}
      className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-center font-medium text-foreground">
        {displayName}
      </span>
    </Link>
  );
};

export default SubcategoryCard;
