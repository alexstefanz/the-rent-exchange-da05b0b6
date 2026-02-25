import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeadProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead = ({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className,
}: SortableTableHeadProps) => {
  const isActive = currentSortKey === sortKey;

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:text-foreground transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && currentDirection === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : isActive && currentDirection === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </div>
    </TableHead>
  );
};

export default SortableTableHead;

export function sortData<T>(data: T[] | undefined, sortKey: string | null, sortDirection: SortDirection): T[] {
  if (!data || !sortKey || !sortDirection) return data || [];

  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let comparison = 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      comparison = aVal.localeCompare(bVal, "ro", { sensitivity: "base" });
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), "ro", { sensitivity: "base" });
    }

    return sortDirection === "desc" ? -comparison : comparison;
  });
}

export function useToggleSort(
  setSortKey: (k: string | null) => void,
  setSortDirection: (d: SortDirection) => void,
  currentSortKey: string | null,
  currentDirection: SortDirection
) {
  return (key: string) => {
    if (currentSortKey === key) {
      if (currentDirection === "asc") {
        setSortDirection("desc");
      } else if (currentDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
}
