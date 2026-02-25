import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";

export type ColumnFilterConfig = {
  key: string;
  type: "text" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

interface TableColumnFilterRowProps {
  filters: ColumnFilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const TableColumnFilterRow = ({ filters, values, onChange }: TableColumnFilterRowProps) => {
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      {filters.map((filter) => (
        <TableCell key={filter.key} className="py-1.5 px-2">
          {filter.type === "text" ? (
            <div className="relative">
              <Input
                placeholder={filter.placeholder || "Filtrează..."}
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="h-7 text-xs pr-6"
              />
              {values[filter.key] && (
                <button
                  onClick={() => onChange(filter.key, "")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : filter.type === "select" ? (
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(v) => onChange(filter.key, v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder={filter.placeholder || "Toate"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {filter.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span />
          )}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default TableColumnFilterRow;

export function applyColumnFilters<T>(
  data: T[] | undefined,
  filters: Record<string, string>
): T[] {
  if (!data) return [];
  return data.filter((row) => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = (row as any)[key];
      if (cellValue == null) return false;
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    });
  });
}
