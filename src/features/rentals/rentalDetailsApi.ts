import { supabase } from "@/integrations/supabase/client";

export interface RentalDetails {
  id: string;
  product_id: string | null;
  renter_id: string | null;
  owner_id: string | null;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  owner_payout: number;
  status: string;
  payment_status: string;
  product_title: string;
  product_images: string[] | null;
  renter_name: string | null;
  owner_name: string | null;
}

export async function getRentalDetailsForNotification(notificationLink: string): Promise<RentalDetails | null> {
  const url = new URL(notificationLink, "https://placeholder.com");
  const rentalId = url.searchParams.get("rental_id");

  if (rentalId) {
    return getRentalById(rentalId);
  }

  // Fallback: get the most recent rental for the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("rentals")
    .select("id")
    .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return getRentalById(data.id);
}

export async function getRentalById(rentalId: string): Promise<RentalDetails | null> {
  const { data, error } = await supabase.rpc("get_rental_details", {
    rental_uuid: rentalId,
  });

  if (error || !data || (data as any[]).length === 0) return null;
  const row = (data as any[])[0];
  return {
    id: row.id,
    product_id: row.product_id,
    renter_id: row.renter_id,
    owner_id: row.owner_id,
    start_date: row.start_date,
    end_date: row.end_date,
    rental_days: row.rental_days,
    subtotal: row.subtotal,
    owner_payout: row.owner_payout,
    status: row.status,
    payment_status: row.payment_status,
    product_title: row.product_title,
    product_images: row.product_images,
    renter_name: row.renter_name,
    owner_name: row.owner_name,
  };
}
