import { useEffect, useState } from "react";
import { Loader2, Package, History as HistoryIcon, ShoppingBag, Activity } from "lucide-react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Product } from "@/features/products/productsApi";

type LogRow = {
  id: string;
  action: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, { ro: string; en: string }> = {
  PRODUCT_CREATED: { ro: "Anunț creat", en: "Listing created" },
  PRODUCT_DEACTIVATED: { ro: "Anunț ascuns", en: "Listing hidden" },
  PRODUCT_REACTIVATED: { ro: "Anunț reactivat", en: "Listing reactivated" },
  PRODUCT_DELETED: { ro: "Anunț șters", en: "Listing deleted" },
  PRICE_CHANGED: { ro: "Preț modificat", en: "Price changed" },
};

const colorFor = (action: string) => {
  if (action.includes("CREATED") || action.includes("REACTIVATED"))
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (action.includes("DELETED") || action.includes("DEACTIVATED"))
    return "bg-rose-100 text-rose-800 border-rose-200";
  if (action.includes("CHANGED") || action.includes("UPDATED"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-muted text-muted-foreground";
};

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ListingHistoryDialog = ({ product, open, onOpenChange }: Props) => {
  const { language } = useLanguage();
  const t = (r: string, e: string) => (language === "ro" ? r : e);
  const locale = language === "ro" ? ro : enUS;

  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product?.id) return;
    let cancelled = false;
    setLoading(true);
    setLogs(null);
    (async () => {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("id, action, metadata, created_at")
        .eq("entity_type", "product")
        .eq("entity_id", product.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (error) console.error("ListingHistoryDialog:", error);
      setLogs((data as LogRow[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, product?.id]);

  const renderMeta = (row: LogRow) => {
    if (!row.metadata) return null;
    const m = row.metadata;
    if (row.action === "PRICE_CHANGED" && (m.old_price || m.new_price)) {
      return (
        <span className="text-xs text-muted-foreground">
          {m.old_price} → <span className="font-semibold text-foreground">{m.new_price} RON</span>
        </span>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            {t("Istoric anunț", "Listing history")}
          </DialogTitle>
          {product && (
            <DialogDescription className="truncate">{product.title}</DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Activity className="h-8 w-8 opacity-40" />
              {t("Nu există evenimente înregistrate pentru acest anunț.", "No events recorded for this listing yet.")}
            </div>
          ) : (
            <ol className="relative space-y-3 border-l border-border pl-4">
              {logs.map((row) => {
                const label = ACTION_LABELS[row.action]?.[language] || row.action.replace(/_/g, " ").toLowerCase();
                return (
                  <li key={row.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary/15 ring-2 ring-background">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={colorFor(row.action)}>
                            {label}
                          </Badge>
                          {renderMeta(row)}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {format(new Date(row.created_at), "d MMM yyyy, HH:mm", { locale })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingHistoryDialog;