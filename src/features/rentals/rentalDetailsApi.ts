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
  // We need to find the rental associated with this notification
  // The link is like /profile?tab=lendings or /profile?tab=rentals
  // We fetch the most recent rental for the current user based on context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get the latest rental for this user (as renter or owner)
  const { data, error } = await supabase
    .from("rentals")
    .select("*")
    .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Fetch product and profiles
  const [productRes, renterRes, ownerRes] = await Promise.all([
    data.product_id ? supabase.from("products").select("title, images").eq("id", data.product_id).single() : Promise.resolve({ data: null }),
    data.renter_id ? supabase.from("profiles").select("full_name").eq("id", data.renter_id).single() : Promise.resolve({ data: null }),
    data.owner_id ? supabase.from("profiles").select("full_name").eq("id", data.owner_id).single() : Promise.resolve({ data: null }),
  ]);

  return {
    id: data.id,
    product_id: data.product_id,
    renter_id: data.renter_id,
    owner_id: data.owner_id,
    start_date: data.start_date,
    end_date: data.end_date,
    rental_days: data.rental_days,
    subtotal: data.subtotal,
    owner_payout: data.owner_payout,
    status: data.status,
    payment_status: data.payment_status,
    product_title: productRes.data?.title || "Produs",
    product_images: productRes.data?.images || null,
    renter_name: renterRes.data?.full_name || null,
    owner_name: ownerRes.data?.full_name || null,
  };
}

export async function getRentalById(rentalId: string): Promise<RentalDetails | null> {
  const { data, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("id", rentalId)
    .single();

  if (error || !data) return null;

  const [productRes, renterRes, ownerRes] = await Promise.all([
    data.product_id ? supabase.from("products").select("title, images").eq("id", data.product_id).single() : Promise.resolve({ data: null }),
    data.renter_id ? supabase.from("profiles").select("full_name").eq("id", data.renter_id).single() : Promise.resolve({ data: null }),
    data.owner_id ? supabase.from("profiles").select("full_name").eq("id", data.owner_id).single() : Promise.resolve({ data: null }),
  ]);

  return {
    id: data.id,
    product_id: data.product_id,
    renter_id: data.renter_id,
    owner_id: data.owner_id,
    start_date: data.start_date,
    end_date: data.end_date,
    rental_days: data.rental_days,
    subtotal: data.subtotal,
    owner_payout: data.owner_payout,
    status: data.status,
    payment_status: data.payment_status,
    product_title: productRes.data?.title || "Produs",
    product_images: productRes.data?.images || null,
    renter_name: renterRes.data?.full_name || null,
    owner_name: ownerRes.data?.full_name || null,
  };
}
