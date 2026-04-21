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
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  refunded_at?: string | null;
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

export async function confirmHandover(rentalId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("rentals")
    .update({ handover_confirmed_at: now, status: "active" })
    .eq("id", rentalId);
  if (error) throw error;
}

export async function confirmReturn(rentalId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("rentals")
    .update({
      return_confirmed_at: now,
      status: "completed",
      completed_at: now,
    })
    .eq("id", rentalId);
  if (error) throw error;

  // Trigger Stripe capture + payout transactions (non-blocking failure logging)
  try {
    await supabase.functions.invoke("capture-rental-payment", {
      body: { rental_id: rentalId },
    });
  } catch (e) {
    console.error("Capture invocation failed (non-blocking):", e);
  }
}
