import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProductBySlug, getProductById, Product } from "@/features/products/productsApi";

/**
 * Hover/focus prefetch helpers. Triggers JS chunk + data fetch before user clicks,
 * so the navigation feels instant.
 */

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function usePrefetchProduct() {
  const qc = useQueryClient();
  const seen = useRef<Set<string>>(new Set());

  return useCallback(
    (slugOrId: string | undefined | null) => {
      if (!slugOrId || seen.current.has(slugOrId)) return;
      seen.current.add(slugOrId);
      // Warm the lazy chunk
      import("@/pages/ProductDetail");
      // Warm the data
      qc.prefetchQuery({
        queryKey: ["product-prefetch", slugOrId],
        queryFn: async (): Promise<Product | null> =>
          isUuid(slugOrId) ? getProductById(slugOrId) : getProductBySlug(slugOrId),
        staleTime: 60_000,
      });
    },
    [qc],
  );
}

export function usePrefetchRoute(loader: () => Promise<unknown>) {
  const done = useRef(false);
  return useCallback(() => {
    if (done.current) return;
    done.current = true;
    loader();
  }, [loader]);
}

export function usePrefetchMyRentals(userId: string | undefined) {
  const qc = useQueryClient();
  const done = useRef(false);
  return useCallback(() => {
    if (!userId || done.current) return;
    done.current = true;
    import("@/pages/RentalsPage");
    qc.prefetchQuery({
      queryKey: ["my-rentals", userId],
      queryFn: async () => {
        const { data } = await supabase
          .from("rentals")
          .select(
            "id, public_id, product_id, owner_id, start_date, end_date, rental_days, subtotal, status, payment_status, handover_confirmed_at, return_confirmed_at, message_to_owner, created_at, products(title, images)",
          )
          .eq("renter_id", userId)
          .order("created_at", { ascending: false });
        return data || [];
      },
      staleTime: 30_000,
    });
  }, [qc, userId]);
}