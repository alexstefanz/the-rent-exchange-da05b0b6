import { supabase } from "@/integrations/supabase/client";

export interface RentalPopupItem {
  id: string;
  public_id: string | null;
  mode: "owner" | "renter";
  outcome: "pending" | "confirmed" | "rejected" | string;
  status: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  message_to_owner: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  counterparty_id: string | null;
  counterparty_name: string | null;
  counterparty_avatar: string | null;
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_slug: string | null;
  category_slug: string | null;
}

function mapRow(row: any): RentalPopupItem {
  return {
    id: row.id,
    public_id: row.public_id,
    mode: row.mode === "owner" ? "owner" : "renter",
    outcome: row.outcome || row.status,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    rental_days: row.rental_days,
    subtotal: Number(row.subtotal || 0),
    message_to_owner: row.message_to_owner,
    created_at: row.created_at,
    confirmed_at: row.confirmed_at,
    counterparty_id: row.counterparty_id,
    counterparty_name: row.counterparty_name,
    counterparty_avatar: row.counterparty_avatar,
    product_id: row.product_id,
    product_title: row.product_title,
    product_image: row.product_image,
    product_slug: row.product_slug,
    category_slug: row.category_slug ?? null,
  };
}

export async function fetchRentalPopups(): Promise<RentalPopupItem[]> {
  const { data, error } = await supabase.rpc("get_rental_popups");
  if (error) {
    console.warn("get_rental_popups", error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function fetchRentalPopupById(rentalId: string): Promise<RentalPopupItem | null> {
  const { data, error } = await supabase.rpc("get_rental_popup_by_id", { _rental_id: rentalId });
  if (error || !data || !data.length) return null;
  return mapRow(data[0]);
}

export async function markRenterConfirmationSeen(rentalId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_renter_confirmation_seen", {
    _rental_id: rentalId,
  });
  if (error) console.warn("markRenterConfirmationSeen", error);
}
