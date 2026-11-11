import { useLanguage } from "@/contexts/LanguageContext";
import type { RentalSortBy } from "./RentalsFilterBar";

export type RentalTabView = "requests" | "active" | "completed" | "cancelled";

const TABS: { key: RentalTabView; label: string; en: string }[] = [
  { key: "requests", label: "Cereri", en: "Requests" },
  { key: "active", label: "Active", en: "Active" },
  { key: "completed", label: "Finalizate", en: "Completed" },
  { key: "cancelled", label: "Anulate", en: "Cancelled" },
];

export const parseTab = (v: string | null): RentalTabView =>
  TABS.some((t) => t.key === v) ? (v as RentalTabView) : "requests";

export const emptyTabText = (view: RentalTabView, role: "renter" | "owner", lang: "ro" | "en" = "ro") => {
  if (lang === "en") return ({ requests: role === "owner" ? "No new requests from renters." : "You have no pending requests.", active: "No rentals in progress.", completed: "No completed rentals yet.", cancelled: "No cancelled or rejected rentals." })[view];
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
  const { language } = useLanguage();
  const tt = (ro: string, en: string) => (language === "ro" ? ro : en);
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
            {language === "ro" ? t.label : t.en}
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
      aria-label={tt("Sortare", "Sort")}
    >
      <option value="newest">{tt("Cele mai noi", "Newest")}</option>
      <option value="oldest">{tt("Cele mai vechi", "Oldest")}</option>
      <option value="amount_desc">{amountLabel}: {tt("descrescător", "high to low")}</option>
      <option value="amount_asc">{amountLabel}: {tt("crescător", "low to high")}</option>
    </select>
  </div>
  );
};

export default RentalTabsBar;
