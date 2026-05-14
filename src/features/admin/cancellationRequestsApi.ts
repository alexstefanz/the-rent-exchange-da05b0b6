import { supabase } from "@/integrations/supabase/client";

export interface PendingCancellationRequest {
  rental_id: string;
  rental_public_id: string | null;
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  subtotal: number;
  platform_fee: number;
  status: string;
  payment_status: string | null;
  renter_id: string;
  renter_name: string | null;
  renter_email: string | null;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  initiator_id: string;
  initiator_role: "renter" | "owner";
  cancel_request_subject: string | null;
  cancel_request_reason: string | null;
  cancel_request_created_at: string;
}

export async function listPendingCancellationRequests(): Promise<PendingCancellationRequest[]> {
  const { data, error } = await supabase.rpc("list_pending_cancellation_requests");
  if (error) throw error;
  return (data || []) as PendingCancellationRequest[];
}

export async function adminApproveCancellation(rentalId: string, note?: string) {
  const { error } = await supabase.rpc("admin_respond_cancellation", {
    _rental_id: rentalId,
    _action: "approve",
    _note: note ?? null,
  });
  if (error) throw error;
  const { data, error: fnErr } = await supabase.functions.invoke("mutual-cancel-rental", {
    body: { rental_id: rentalId },
  });
  if (fnErr) throw fnErr;
  if ((data as any)?.error) throw new Error((data as any).error);
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "cancel_request_approved" },
  }).catch(() => {});
  return data;
}

export async function adminRejectCancellation(rentalId: string, note?: string) {
  const { error } = await supabase.rpc("admin_respond_cancellation", {
    _rental_id: rentalId,
    _action: "reject",
    _note: note ?? null,
  });
  if (error) throw error;
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "cancel_request_rejected" },
  }).catch(() => {});
  return { ok: true };
}

/**
 * Open or create a conversation with a user about a rental.
 * Returns the conversation id; navigate to /messages?conversation=<id>.
 */
export async function openAdminConversation(otherUserId: string, productId: string | null, rentalId: string | null): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const adminId = userData?.user?.id;
  if (!adminId) throw new Error("unauthenticated");

  // Try to find an existing conversation between admin (as buyer) and the other user (as owner) for this product.
  if (productId) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", adminId)
      .eq("owner_id", otherUserId)
      .eq("product_id", productId)
      .maybeSingle();
    if (existing?.id) return existing.id;
  }

  const insertPayload: any = {
    buyer_id: adminId,
    owner_id: otherUserId,
    product_id: productId,
    rentals_id: rentalId,
  };
  const { data: created, error } = await supabase
    .from("conversations")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}
