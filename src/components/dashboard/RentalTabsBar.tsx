import type { RentalSortBy } from "./RentalsFilterBar";

export type RentalTabView = "requests" | "active" | "completed" | "cancelled";

const TABS: { key: RentalTabView; label: string }[] = [
  { key: "requests", label: "Cereri" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Finalizate" },
  { key: "cancelled", label: "Anulate" },
];

export const parseTab = (v: string | null): RentalTabView =>
  TABS.some((t) => t.key === v) ? (v as RentalTabView) : "requests";

export const emptyTabText = (view: RentalTabView, role: "renter" | "owner") => {
  const map = {
    requests: role === "owner" ? "Nu ai cereri noi de la chiriași." : "Nu ai cereri în așteptare.",
    active: "Nu ai închirieri în derulare.",
    completed: "Nu ai încă închirieri finalizate.",
    cancelled: "Nu ai închirieri anulate sau refuzate.",
  };
  return map[view];
};

interface Props {
  view: RentalTabView;
  onChange: (v: RentalTabView) => void;
  counts: Record<RentalTabView, number>;
  sortBy: RentalSortBy;
  onSortChange: (v: RentalSortBy) => void;
  amountLabel: string;
  accent?: "primary" | "blue";
}

const RentalTabsBar = ({ view, onChange, counts, sortBy, onSortChange, amountLabel, accent = "primary" }: Props) => {
  const activeCls = accent === "blue" ? "bg-sky-600 text-white shadow-sm" : "bg-primary text-primary-foreground shadow-sm";
  const pulseCls = accent === "blue" ? "animate-pulse bg-sky-600 text-white" : "animate-pulse bg-primary text-primary-foreground";
  return (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="grid w-full grid-cols-4 rounded-xl border border-border bg-muted/40 p-1 sm:inline-grid sm:w-auto">
      {TABS.map((t) => {
        const active = view === t.key;
        const pulse = t.key === "requests" && counts.requests > 0 && !active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              active ? activeCls : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 rounded-full px-1.5 text-xs ${active ? "bg-background/25" : pulse ? pulseCls : "bg-background"}`}>
              {counts[t.key]}
            </span>
          </button>
        );
      })}
    </div>
    <select
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value as RentalSortBy)}
      className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
      aria-label="Sortare"
    >
      <option value="newest">Cele mai noi</option>
      <option value="oldest">Cele mai vechi</option>
      <option value="amount_desc">{amountLabel}: descrescător</option>
      <option value="amount_asc">{amountLabel}: crescător</option>
    </select>
  </div>
  );
};

export default RentalTabsBar;
