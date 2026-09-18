import { ArrowUpDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type RentalStatusFilter = "all" | "ongoing" | "active" | "in_progress" | "overdue" | "pending" | "completed" | "cancelled";
export type RentalSortBy = "newest" | "oldest" | "amount_desc" | "amount_asc";

interface Counts {
  all: number;
  active: number;
  in_progress: number;
  overdue: number;
  pending: number;
  completed: number;
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
  const ongoing = counts.pending + counts.active + counts.in_progress + counts.overdue;
  const items: { key: RentalStatusFilter; label: string; count: number }[] = [
    { key: "all", label: "Toate", count: counts.all },
    { key: "ongoing", label: "În desfășurare", count: ongoing },
    { key: "active", label: "Confirmate", count: counts.active },
    { key: "in_progress", label: "În derulare", count: counts.in_progress },
    { key: "overdue", label: "Întârziate", count: counts.overdue },
    { key: "pending", label: "În așteptare", count: counts.pending },
    { key: "completed", label: "Finalizate", count: counts.completed },
    { key: "cancelled", label: "Anulate", count: counts.cancelled },
  ];


  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as RentalStatusFilter)}>
        <SelectTrigger className="w-full sm:w-[220px] h-9">
          <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.key} value={it.key}>
              <span className={it.key === "overdue" && it.count > 0 ? "text-amber-700 font-medium" : undefined}>
                {it.label} ({it.count})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
