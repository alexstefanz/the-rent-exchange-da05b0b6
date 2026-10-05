import { supabase } from "@/integrations/supabase/client";
import { createOpsTicket, updateOpsTicketField, createTicketMessage } from "@/features/admin/opsTicketsApi";

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

export interface ResolvedCancellationRequest extends PendingCancellationRequest {
  cancel_request_status: "approved" | "rejected" | "direct";
  cancel_request_responded_at: string | null;
  cancel_request_admin_note: string | null;
  cancel_request_response_note: string | null;
  cancel_request_admin_id: string | null;
  cancellation_reason?: string | null;
}

async function listDirectCancellations(excludeIds: Set<string>): Promise<ResolvedCancellationRequest[]> {
  const { data: rentals, error } = await (supabase.from("rentals") as any)
    .select("id, public_id, product_id, start_date, end_date, rental_days, subtotal, platform_fee, status, payment_status, renter_id, owner_id, cancellation_reason, cancelled_at, updated_at, created_at")
    .eq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = ((rentals || []) as any[]).filter((r) => !excludeIds.has(r.id));
  if (!rows.length) return [];
  const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];
  const userIds = [...new Set(rows.flatMap((r) => [r.renter_id, r.owner_id]))];
  const [{ data: products }, { data: profiles }] = await Promise.all([
    productIds.length ? supabase.from("products").select("id, title, images").in("id", productIds) : Promise.resolve({ data: [] as any[] }),
    supabase.from("profiles").select("id, full_name, email").in("id", userIds),
  ]);
  const pMap = new Map(((products || []) as any[]).map((p) => [p.id, p]));
  const uMap = new Map(((profiles || []) as any[]).map((u) => [u.id, u]));
  return rows.map((r) => {
    const p = pMap.get(r.product_id);
    const rp = uMap.get(r.renter_id);
    const op = uMap.get(r.owner_id);
    const reason: string = r.cancellation_reason || "";
    const byOwner = reason.startsWith("owner");
    const when = r.cancelled_at || r.updated_at || r.created_at;
    return {
      rental_id: r.id,
      rental_public_id: r.public_id,
      product_id: r.product_id,
      product_title: p?.title ?? null,
      product_image: p?.images?.[0] ?? null,
      start_date: r.start_date,
      end_date: r.end_date,
      total_days: r.rental_days,
      subtotal: r.subtotal,
      platform_fee: r.platform_fee,
      status: r.status,
      payment_status: r.payment_status,
      renter_id: r.renter_id,
      renter_name: rp?.full_name ?? null,
      renter_email: rp?.email ?? null,
      owner_id: r.owner_id,
      owner_name: op?.full_name ?? null,
      owner_email: op?.email ?? null,
      initiator_id: byOwner ? r.owner_id : r.renter_id,
      initiator_role: byOwner ? "owner" : "renter",
      cancel_request_subject: null,
      cancel_request_reason: null,
      cancel_request_created_at: when,
      cancel_request_status: "direct",
      cancel_request_responded_at: when,
      cancel_request_admin_note: null,
      cancel_request_response_note: null,
      cancel_request_admin_id: null,
      cancellation_reason: reason || null,
    } as ResolvedCancellationRequest;
  });
}

export async function listResolvedCancellationRequests(): Promise<ResolvedCancellationRequest[]> {
  const { data, error } = await (supabase as any).rpc("list_resolved_cancellation_requests");
  if (error) throw error;
  const mutual = (data || []) as ResolvedCancellationRequest[];
  const direct = await listDirectCancellations(new Set(mutual.map((m) => m.rental_id)));
  return [...mutual, ...direct].sort(
    (a, b) => new Date(b.cancel_request_responded_at || 0).getTime() - new Date(a.cancel_request_responded_at || 0).getTime(),
  );
}

export function describeCancellationReason(reason?: string | null): string {
  switch (reason) {
    case "renter_self_unpaid": return "Anulată direct de chiriaș (neplătită)";
    case "owner_self_unpaid": return "Anulată direct de proprietar (neplătită)";
    case "admin_self_unpaid": return "Anulată de admin (neplătită)";
    default: return reason ? `Anulată (${reason})` : "Anulată";
  }
}

export async function adminApproveCancellation(rentalId: string, note?: string) {
  const { error } = await supabase.rpc("admin_respond_cancellation", {
    _rental_id: rentalId,
    _action: "approve",
    _note: note ?? null,
  });
  if (error) throw error;

  // Load rental context for ticket
  const { data: rental } = await supabase
    .from("rentals")
    .select("id, public_id, product_id, renter_id, owner_id, subtotal, platform_fee, payment_status, cancel_request_subject, cancel_request_reason, cancel_request_initiator")
    .eq("id", rentalId)
    .maybeSingle();

  // Find or create refund ticket (avoid duplicates)
  let ticketId: string | null = null;
  let ticketPublicId: string | null = null;
  try {
    const { data: existing } = await (supabase.from("ops_tickets" as any) as any)
      .select("id, public_id")
      .eq("reservation_id", rentalId)
      .contains("tags", ["cancel-refund"])
      .not("status", "in", "(CLOSED,RESOLVED)")
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      ticketId = existing.id;
      ticketPublicId = existing.public_id;
    }
  } catch { /* ignore */ }

  if (!ticketId && rental) {
    const initiatorIsRenter = rental.cancel_request_initiator === "renter";
    const initiatorLabel = initiatorIsRenter ? "chiriaș" : "proprietar";
    const requesterId = initiatorIsRenter ? rental.renter_id : rental.owner_id;
    const subtotal = Number(rental.subtotal || 0);
    const fee = Number(rental.platform_fee || 0);
    const total = (subtotal + fee).toFixed(2);
    const description = [
      `Anulare aprobată mutual pentru rezervarea ${rental.public_id || rentalId}.`,
      `Inițiator: ${initiatorLabel}.`,
      rental.cancel_request_subject ? `Subiect: ${rental.cancel_request_subject}` : null,
      rental.cancel_request_reason ? `Motiv: ${rental.cancel_request_reason}` : null,
      `Sume: ${subtotal.toFixed(2)} RON + comision ${fee.toFixed(2)} RON = ${total} RON`,
      `Status plată curent: ${rental.payment_status || "—"}`,
      note ? `Notă admin: ${note}` : null,
    ].filter(Boolean).join("\n");

    try {
      const ticket = await createOpsTicket({
        title: `Refund anulare ${rental.public_id || rentalId.slice(0, 8)}`,
        description,
        category_group: "FINANCIAL",
        category_type: "REFUND_REQUEST",
        priority: "HIGH",
        reservation_id: rentalId,
        product_id: rental.product_id,
        requester_user_id: requesterId,
        rental_user_id: rental.renter_id,
        owner_user_id: rental.owner_id,
        tags: ["cancel-refund", "auto"],
      });
      ticketId = ticket.id;
      ticketPublicId = ticket.public_id;
      await updateOpsTicketField(ticketId, "status", "NEW", "IN_PROGRESS", "STATUS_CHANGED");
    } catch (e) {
      console.error("[adminApproveCancellation] ticket create failed", e);
    }
  }

  // Process refund via edge function
  let refundData: any = null;
  let refundError: Error | null = null;
  try {
    const { data, error: fnErr } = await supabase.functions.invoke("mutual-cancel-rental", {
      body: { rental_id: rentalId },
    });
    if (fnErr) throw fnErr;
    if ((data as any)?.error) throw new Error((data as any).error);
    refundData = data;
  } catch (e: any) {
    refundError = e instanceof Error ? e : new Error(String(e?.message || e));
  }

  // Update ticket based on refund outcome
  if (ticketId) {
    if (refundError) {
      try {
        await createTicketMessage(ticketId, `❌ Refund automat a eșuat: ${refundError.message}. Necesită intervenție manuală.`, false, "ADMIN");
      } catch { /* ignore */ }
    } else {
      const ps = (refundData as any)?.payment_status;
      const msg = ps === "voided"
        ? "✅ Refund procesat automat: hold-ul Stripe a fost anulat înainte de capture (payment_status = voided)."
        : ps === "refunded"
          ? "✅ Refund procesat automat: suma completă a fost returnată chiriașului (payment_status = refunded)."
          : `✅ Refund procesat automat (payment_status = ${ps || "n/a"}).`;
      try {
        await createTicketMessage(ticketId, msg, false, "ADMIN");
        await updateOpsTicketField(ticketId, "status", "IN_PROGRESS", "RESOLVED", "REFUND_COMPLETED");
      } catch (e) {
        console.error("[adminApproveCancellation] ticket resolve failed", e);
      }
    }
  }

  if (refundError) throw refundError;

  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "cancel_request_approved" },
  }).catch(() => {});

  return { ...refundData, ticket_id: ticketId, ticket_public_id: ticketPublicId };
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

  // Ensure productId is present (conversations.product_id is NOT NULL)
  let resolvedProductId = productId;
  if (!resolvedProductId && rentalId) {
    const { data: rental } = await supabase
      .from("rentals")
      .select("product_id")
      .eq("id", rentalId)
      .maybeSingle();
    resolvedProductId = rental?.product_id ?? null;
  }
  if (!resolvedProductId) throw new Error("Produsul asociat rezervării nu a fost găsit.");

  // Reuse existing admin↔user conversation for this product (no rental link, since rentals_id is unique)
  const { data: existingConvs } = await supabase
    .from("conversations")
    .select("id, buyer_id, owner_id")
    .eq("product_id", resolvedProductId)
    .is("rentals_id", null);
  const match = (existingConvs || []).find(
    (c: any) =>
      (c.buyer_id === adminId && c.owner_id === otherUserId) ||
      (c.owner_id === adminId && c.buyer_id === otherUserId)
  );
  if (match) return (match as any).id;

  // Note: do NOT set rentals_id — it has a UNIQUE constraint and is already used by the renter↔owner conversation.
  const insertPayload: any = {
    buyer_id: adminId,
    owner_id: otherUserId,
    product_id: resolvedProductId,
  };
  const { data: created, error } = await supabase
    .from("conversations")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}
