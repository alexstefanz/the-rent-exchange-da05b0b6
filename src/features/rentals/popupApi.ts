import { supabase } from "@/integrations/supabase/client";

export interface RentalPopupItem {
  id: string;
  public_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  message_to_owner: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  // Counterparty (renter for owner-popup, owner for renter-popup)
  counterparty_id: string | null;
  counterparty_name: string | null;
  counterparty_avatar: string | null;
  counterparty_city: string | null;
  // Product
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_slug: string | null;
}

const SELECT_COLS = `
  id, public_id, status, start_date, end_date, rental_days, subtotal,
  message_to_owner, created_at, confirmed_at,
  owner_id, renter_id,
  product:products!rentals_product_id_fkey ( id, title, images, slug )
`;

async function attachCounterparties(rows: any[], mode: "owner" | "renter"): Promise<RentalPopupItem[]> {
  if (!rows.length) return [];
  const ids = Array.from(
    new Set(
      rows
        .map((r) => (mode === "owner" ? r.renter_id : r.owner_id))
        .filter((v): v is string => !!v),
    ),
  );
  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);
    (profiles || []).forEach((p: any) => profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  }
  return rows.map((row) => mapRow(row, mode, profileMap.get(mode === "owner" ? row.renter_id : row.owner_id) || null));
}

function mapRow(
  row: any,
  mode: "owner" | "renter",
  profile: { full_name: string | null; avatar_url: string | null } | null = null,
): RentalPopupItem {
  const product = row.product || {};
  return {
    id: row.id,
    public_id: row.public_id,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    rental_days: row.rental_days,
    subtotal: Number(row.subtotal || 0),
    message_to_owner: row.message_to_owner,
    created_at: row.created_at,
    confirmed_at: row.confirmed_at,
    counterparty_id: mode === "owner" ? row.renter_id : row.owner_id,
    counterparty_name: profile?.full_name ?? null,
    counterparty_avatar: profile?.avatar_url ?? null,
    counterparty_city: null,
    product_id: product?.id ?? null,
    product_title: product?.title ?? null,
    product_image: Array.isArray(product?.images) && product.images[0] ? product.images[0] : null,
    product_slug: product?.slug ?? null,
  };
}

export async function fetchPendingForOwner(ownerId: string): Promise<RentalPopupItem[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select(SELECT_COLS)
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) {
    console.warn("fetchPendingForOwner", error);
    return [];
  }
  return attachCounterparties(data || [], "owner");
}

export async function fetchUnseenConfirmedForRenter(renterId: string): Promise<RentalPopupItem[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select(SELECT_COLS)
    .eq("renter_id", renterId)
    .eq("status", "confirmed")
    .eq("renter_seen_confirmation", false)
    .order("confirmed_at", { ascending: false })
    .limit(10);
  if (error) {
    console.warn("fetchUnseenConfirmedForRenter", error);
    return [];
  }
  return attachCounterparties(data || [], "renter");
}

export async function fetchRentalForPopup(
  rentalId: string,
  mode: "owner" | "renter",
): Promise<RentalPopupItem | null> {
  const { data, error } = await supabase
    .from("rentals")
    .select(SELECT_COLS)
    .eq("id", rentalId)
    .maybeSingle();
  if (error || !data) return null;
  const [item] = await attachCounterparties([data], mode);
  return item || null;
}

export async function markRenterConfirmationSeen(rentalId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_renter_confirmation_seen", {
    _rental_id: rentalId,
  });
  if (error) console.warn("markRenterConfirmationSeen", error);
}