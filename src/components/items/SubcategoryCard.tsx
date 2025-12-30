import { Link } from "react-router-dom";

interface SubcategoryCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  categoryId: number;
}

const SubcategoryCard = ({ id, name, image, categoryId }: SubcategoryCardProps) => {
  return (
    <Link
      to={`/subcategorie/${id}`}
      className="group relative block aspect-[4/3] overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: "15px" }}
    >
      {/* Background Image */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* Dark Overlay 30% */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Text Content - Centered with shadow */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <h3 
          className="text-center font-heading text-lg font-bold text-white drop-shadow-lg md:text-xl"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {name}
        </h3>
      </div>
    </Link>
  );
};

export default SubcategoryCard;
