import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ItemCardProps {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  image: string;
  location: string;
  rating: number;
  category: string;
}

const ItemCard = ({
  id,
  title,
  price,
  priceUnit,
  image,
  location,
  rating,
  category,
}: ItemCardProps) => {
  return (
    <Link
      to={`/item/${id}`}
      className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur-sm">
          {category}
        </Badge>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-medium leading-tight text-foreground line-clamp-2">
            {title}
          </h3>
          <div className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{location}</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-primary">${price}</span>
          <span className="text-sm text-muted-foreground">/ {priceUnit}</span>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
