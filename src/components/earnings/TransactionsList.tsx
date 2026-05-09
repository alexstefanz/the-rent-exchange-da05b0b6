import { useState, useMemo } from "react";
import { ChevronRight, Receipt, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatusBadge, type EarningsStatus } from "./statusBadge";
import TransactionDetailDrawer from "./TransactionDetailDrawer";
import type { EarningsTransaction } from "@/hooks/useEarnings";

const filterChips: { value: "all" | EarningsStatus; ro: string; en: string }[] = [
  { value: "all", ro: "Toate", en: "All" },
  { value: "available", ro: "Disponibile", en: "Available" },
  { value: "held", ro: "Blocate", en: "Held" },
  { value: "cancelled", ro: "Anulate", en: "Cancelled" },
];

export const TransactionsList = ({ transactions }: { transactions: EarningsTransaction[] }) => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<"all" | EarningsStatus>("all");
  const [selected, setSelected] = useState<EarningsTransaction | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? transactions : transactions.filter((tx) => tx.status === filter)),
    [transactions, filter]
  );

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB") : "—");

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Receipt className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">{t("Încă nu ai câștiguri", "No earnings yet")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t(
            "După prima închiriere finalizată, banii vor apărea aici.",
            "After your first completed rental, funds will show up here."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-5 sm:p-6 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">{t("Istoric tranzacții", "Transaction history")}</h3>
          <span className="text-xs text-muted-foreground">{filtered.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === c.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {language === "ro" ? c.ro : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">{t("Produs", "Product")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("Sumă", "Amount")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("Perioada", "Period")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("Status", "Status")}</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setSelected(tx)}
                className="border-t hover:bg-muted/30 cursor-pointer transition"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {tx.productImage ? (
                      <img src={tx.productImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[260px]">{tx.productTitle}</p>
                      {tx.rentalPublicId && (
                        <p className="text-[11px] text-muted-foreground font-mono">{tx.rentalPublicId}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-emerald-700">
                  +{tx.ownerPayout.toFixed(2)} RON
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {fmt(tx.startDate)} – {fmt(tx.endDate)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tx.status as EarningsStatus} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {filtered.map((tx) => (
          <button
            key={tx.id}
            onClick={() => setSelected(tx)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 text-left transition"
          >
            {tx.productImage ? (
              <img src={tx.productImage} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ImageOff className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{tx.productTitle}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={tx.status as EarningsStatus} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-emerald-700 tabular-nums text-sm">
                +{tx.ownerPayout.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{fmt(tx.date)}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">
          {t("Nicio tranzacție pentru acest filtru.", "No transactions for this filter.")}
        </div>
      )}

      <TransactionDetailDrawer
        tx={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
};

export default TransactionsList;