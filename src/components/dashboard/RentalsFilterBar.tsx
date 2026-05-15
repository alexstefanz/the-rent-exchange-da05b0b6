import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type RentalStatusFilter = "all" | "active" | "pending" | "cancelled";
export type RentalSortBy = "newest" | "oldest" | "amount_desc" | "amount_asc";

interface Counts {
  all: number;
  active: number;
  pending: number;
  cancelled: number;
}

interface Props {
  statusFilter: RentalStatusFilter;
  onStatusFilterChange: (v: RentalStatusFilter) => void;
  sortBy: RentalSortBy;
  onSortChange: (v: RentalSortBy) => void;
  counts: Counts;
  amountLabel?: string;
}

const RentalsFilterBar = ({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  counts,
  amountLabel = "Sumă",
}: Props) => {
  const items: { key: RentalStatusFilter; label: string; count: number }[] = [
    { key: "all", label: "Toate", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "pending", label: "În așteptare", count: counts.pending },
    { key: "cancelled", label: "Anulate", count: counts.cancelled },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 -mx-1 px-1 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {items.map((it) => {
            const active = statusFilter === it.key;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onStatusFilterChange(it.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                )}
              >
                {it.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 min-w-5 px-1.5 text-[10px] font-semibold",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : ""
                  )}
                >
                  {it.count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as RentalSortBy)}>
        <SelectTrigger className="w-full sm:w-[200px] h-9">
          <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <SelectValue placeholder="Sortare" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Cele mai noi</SelectItem>
          <SelectItem value="oldest">Cele mai vechi</SelectItem>
          <SelectItem value="amount_desc">{amountLabel}: mare → mic</SelectItem>
          <SelectItem value="amount_asc">{amountLabel}: mic → mare</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RentalsFilterBar;
