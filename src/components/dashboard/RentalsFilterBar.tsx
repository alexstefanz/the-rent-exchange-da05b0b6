import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
  const ongoing = counts.pending + counts.active + counts.in_progress + counts.overdue;
  const items: { key: RentalStatusFilter; label: string; count: number }[] = [
    { key: "all", label: t("Toate", "All"), count: counts.all },
    { key: "ongoing", label: t("În desfășurare", "Ongoing"), count: ongoing },
    { key: "active", label: t("Confirmate", "Confirmed"), count: counts.active },
    { key: "in_progress", label: t("În derulare", "In progress"), count: counts.in_progress },
    { key: "overdue", label: t("Întârziate", "Overdue"), count: counts.overdue },
    { key: "pending", label: t("În așteptare", "Pending"), count: counts.pending },
    { key: "completed", label: t("Finalizate", "Completed"), count: counts.completed },
    { key: "cancelled", label: t("Anulate", "Cancelled"), count: counts.cancelled },
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
          <SelectValue placeholder={t("Sortare", "Sort")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t("Cele mai noi", "Newest")}</SelectItem>
          <SelectItem value="oldest">{t("Cele mai vechi", "Oldest")}</SelectItem>
          <SelectItem value="amount_desc">{amountLabel}: {t("mare → mic", "high → low")}</SelectItem>
          <SelectItem value="amount_asc">{amountLabel}: {t("mic → mare", "low → high")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RentalsFilterBar;
