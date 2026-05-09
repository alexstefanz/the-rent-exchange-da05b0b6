import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Package, ExternalLink, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CATEGORY_GROUP_LABELS, CATEGORY_TYPES, type OpsTicket } from "@/features/tickets/userTicketsApi";

export function TicketContextPanel({ ticket }: { ticket: OpsTicket }) {
  const { t } = useLanguage();

  const { data: rental } = useQuery({
    queryKey: ["ticketCtxRental", ticket.reservation_id],
    queryFn: async () => {
      if (!ticket.reservation_id) return null;
      const { data } = await supabase
        .from("rentals")
        .select("id, public_id, start_date, end_date, status")
        .eq("id", ticket.reservation_id)
        .maybeSingle();
      return data;
    },
    enabled: !!ticket.reservation_id,
  });

  const { data: product } = useQuery({
    queryKey: ["ticketCtxProduct", ticket.product_id],
    queryFn: async () => {
      if (!ticket.product_id) return null;
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, images")
        .eq("id", ticket.product_id)
        .maybeSingle();
      return data;
    },
    enabled: !!ticket.product_id,
  });

  const categoryLabel = CATEGORY_GROUP_LABELS[ticket.category_group] || ticket.category_group;
  const typeLabel = CATEGORY_TYPES[ticket.category_group]?.find((c) => c.value === ticket.category_type)?.label || ticket.category_type;

  return (
    <aside className="space-y-3">
      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium">
          <Tag className="h-3.5 w-3.5" />
          {t("Categorie", "Category")}
        </div>
        <p className="text-sm font-medium">{categoryLabel}</p>
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
      </div>

      {product && (
        <Link
          to={`/produs/${product.slug}`}
          className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3 hover:border-primary/40 transition group"
        >
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-muted grid place-items-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">{t("Produs asociat", "Linked product")}</p>
            <p className="text-sm font-medium truncate">{product.title}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </Link>
      )}

      {rental && (
        <Link
          to={`/rezervari`}
          className="block rounded-2xl bg-card border border-border/60 p-4 hover:border-primary/40 transition group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">{t("Rezervare", "Reservation")}</p>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="text-sm font-mono font-semibold">{rental.public_id}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(rental.start_date).toLocaleDateString("ro-RO")} → {new Date(rental.end_date).toLocaleDateString("ro-RO")}</span>
          </div>
        </Link>
      )}
    </aside>
  );
}