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
  const { data, error } = await supabase.rpc("get_owner_rentals", {
    owner_uuid: ownerId,
  });

  if (error) throw error;
  return (data || []) as OwnerRental[];
}

export async function respondToRental(rentalId: string, action: "accept" | "reject", reason?: string) {
  const { data, error } = await supabase.functions.invoke("respond-rental-request", {
    body: { rental_id: rentalId, action, reason },
  });
  if (error) throw error;
  return data;
}
