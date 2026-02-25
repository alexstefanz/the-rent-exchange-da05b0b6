import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TableCell, TableRow } from "@/components/ui/table";
import { X, CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type ColumnFilterConfig = {
  key: string;
  type: "text" | "select" | "combobox" | "daterange" | "amountrange";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

interface TableColumnFilterRowProps {
  filters: ColumnFilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  dateRangeValues?: Record<string, { from?: Date; to?: Date }>;
  onDateRangeChange?: (key: string, range: { from?: Date; to?: Date }) => void;
}

const ComboboxFilter = ({
  filter,
  value,
  onChange,
}: {
  filter: ColumnFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = filter.options?.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-7 text-xs w-full justify-between font-normal px-2"
        >
          <span className="truncate">
            {value
              ? filter.options?.find((o) => o.value === value)?.label || value
              : filter.placeholder || "Toate"}
          </span>
          {value ? (
            <X
              className="h-3 w-3 shrink-0 ml-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }}
            />
          ) : (
            <Search className="h-3 w-3 shrink-0 ml-1 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Caută..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
            onClick={() => {
              onChange("");
              setOpen(false);
              setSearch("");
            }}
          >
            Toate
          </button>
          {filtered.map((opt) => (
            <button
              key={opt.value}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-accent",
                value === opt.value && "bg-accent font-medium"
              )}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                setSearch("");
              }}
            >
              {opt.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Niciun rezultat
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DateRangeFilter = ({
  filterKey,
  placeholder,
  dateRange,
  onDateRangeChange,
}: {
  filterKey: string;
  placeholder?: string;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange?: (key: string, range: { from?: Date; to?: Date }) => void;
}) => {
  const hasValue = dateRange?.from || dateRange?.to;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-7 text-xs w-full justify-between font-normal px-2"
        >
          <span className="truncate">
            {hasValue
              ? `${dateRange?.from ? format(dateRange.from, "d MMM", { locale: ro }) : "..."} - ${dateRange?.to ? format(dateRange.to, "d MMM", { locale: ro }) : "..."}`
              : placeholder || "Perioadă"}
          </span>
          {hasValue ? (
            <X
              className="h-3 w-3 shrink-0 ml-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDateRangeChange?.(filterKey, {});
              }}
            />
          ) : (
            <CalendarIcon className="h-3 w-3 shrink-0 ml-1 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2 text-xs text-muted-foreground font-medium">De la:</div>
        <Calendar
          mode="single"
          selected={dateRange?.from}
          onSelect={(d) =>
            onDateRangeChange?.(filterKey, { ...dateRange, from: d || undefined })
          }
          className={cn("p-3 pointer-events-auto")}
          locale={ro}
        />
        <div className="border-t p-2 text-xs text-muted-foreground font-medium">Până la:</div>
        <Calendar
          mode="single"
          selected={dateRange?.to}
          onSelect={(d) =>
            onDateRangeChange?.(filterKey, { ...dateRange, to: d || undefined })
          }
          className={cn("p-3 pointer-events-auto")}
          locale={ro}
        />
      </PopoverContent>
    </Popover>
  );
};

const amountRangeOptions = [
  { value: "0-100", label: "0 - 100 RON" },
  { value: "100-500", label: "100 - 500 RON" },
  { value: "500-1000", label: "500 - 1000 RON" },
  { value: "1000+", label: "1000+ RON" },
];

const TableColumnFilterRow = ({
  filters,
  values,
  onChange,
  dateRangeValues,
  onDateRangeChange,
}: TableColumnFilterRowProps) => {
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
          ) : filter.type === "combobox" ? (
            <ComboboxFilter
              filter={filter}
              value={values[filter.key] || ""}
              onChange={(v) => onChange(filter.key, v)}
            />
          ) : filter.type === "daterange" ? (
            <DateRangeFilter
              filterKey={filter.key}
              placeholder={filter.placeholder}
              dateRange={dateRangeValues?.[filter.key]}
              onDateRangeChange={onDateRangeChange}
            />
          ) : filter.type === "amountrange" ? (
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(v) => onChange(filter.key, v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder={filter.placeholder || "Sumă"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {amountRangeOptions.map((opt) => (
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
  filters: Record<string, string>,
  dateRangeFilters?: Record<string, { from?: Date; to?: Date }>
): T[] {
  if (!data) return [];
  return data.filter((row) => {
    // Text/select/combobox filters
    const textMatch = Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;

      // Amount range filter
      if (filterValue.includes("-") && filterValue.match(/^\d+-\d+$/)) {
        const [min, max] = filterValue.split("-").map(Number);
        const cellValue = Number((row as any)[key]);
        return cellValue >= min && cellValue <= max;
      }
      if (filterValue.endsWith("+")) {
        const min = Number(filterValue.replace("+", ""));
        const cellValue = Number((row as any)[key]);
        return cellValue >= min;
      }

      const cellValue = (row as any)[key];
      if (cellValue == null) return false;
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    });

    // Date range filters
    const dateMatch = dateRangeFilters
      ? Object.entries(dateRangeFilters).every(([key, range]) => {
          if (!range?.from && !range?.to) return true;
          const cellValue = (row as any)[key];
          if (!cellValue) return false;
          const cellDate = new Date(cellValue);
          if (range.from && cellDate < range.from) return false;
          if (range.to) {
            const endOfDay = new Date(range.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (cellDate > endOfDay) return false;
          }
          return true;
        })
      : true;

    return textMatch && dateMatch;
  });
}
