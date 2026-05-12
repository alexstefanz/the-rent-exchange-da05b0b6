import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Props {
  to: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  amountLabel: string;
}

const RentalProductCard = ({ to, image, title, startDate, endDate, status, amount, amountLabel }: Props) => {
  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <StatusBadge status={status as any} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {startDate} – {endDate}
        </p>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{amountLabel}</span>
          <span className="text-sm font-semibold text-primary">{amount} RON</span>
        </div>
      </div>
    </Link>
  );
};

export default RentalProductCard;