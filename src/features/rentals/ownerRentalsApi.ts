import { supabase } from "@/integrations/supabase/client";

export interface OwnerRental {
  id: string;
  product_id: string | null;
  renter_id: string | null;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_price: number;
  subtotal: number;
  platform_fee: number;
  owner_payout: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string | null;
  product_title: string;
  product_image: string | null;
  renter_name: string | null;
  renter_avatar: string | null;
}

export async function getOwnerRentals(ownerId: string): Promise<OwnerRental[]> {
  const { data: rentals, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rentals || rentals.length === 0) return [];

  // Gather unique product and renter IDs
  const productIds = [...new Set(rentals.map(r => r.product_id).filter(Boolean))] as string[];
  const renterIds = [...new Set(rentals.map(r => r.renter_id).filter(Boolean))] as string[];

  const [productsRes, rentersRes] = await Promise.all([
    productIds.length > 0
      ? supabase.from("products").select("id, title, images").in("id", productIds)
      : Promise.resolve({ data: [] }),
    renterIds.length > 0
      ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", renterIds)
      : Promise.resolve({ data: [] }),
  ]);

  const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));
  const rentersMap = new Map((rentersRes.data || []).map(r => [r.id, r]));

  return rentals.map(r => {
    const product = r.product_id ? productsMap.get(r.product_id) : null;
    const renter = r.renter_id ? rentersMap.get(r.renter_id) : null;
    return {
      id: r.id,
      product_id: r.product_id,
      renter_id: r.renter_id,
      start_date: r.start_date,
      end_date: r.end_date,
      rental_days: r.rental_days,
      daily_price: r.daily_price,
      subtotal: r.subtotal,
      platform_fee: r.platform_fee,
      owner_payout: r.owner_payout,
      status: r.status,
      payment_status: r.payment_status,
      payment_method: r.payment_method,
      created_at: r.created_at,
      product_title: product?.title || "Produs",
      product_image: product?.images?.[0] || null,
      renter_name: renter?.full_name || null,
      renter_avatar: renter?.avatar_url || null,
    };
  });
}

export async function respondToRental(rentalId: string, action: "accept" | "reject", reason?: string) {
  const { data, error } = await supabase.functions.invoke("respond-rental-request", {
    body: { rental_id: rentalId, action, reason },
  });
  if (error) throw error;
  return data;
}
