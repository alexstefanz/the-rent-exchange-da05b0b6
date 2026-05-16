import { supabase } from "@/integrations/supabase/client";

export interface OwnerRental {
  id: string;
  public_id: string | null;
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
  dispute_status?: string | null;
  pickup_agreed_at?: string | null;
  rejection_reason?: string | null;
  message_to_owner?: string | null;
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
  if (error) throw mapPvError(error);
}

export async function confirmReturn(rentalId: string) {
  // 1) Capture Stripe payment FIRST — if this fails, do not mark as completed
  const { data: captureData, error: captureErr } = await supabase.functions.invoke(
    "capture-rental-payment",
    { body: { rental_id: rentalId } },
  );
  if (captureErr) {
    throw new Error(
      captureErr.message || "Captura plății a eșuat. Contactează suportul."
    );
  }
  if (captureData && (captureData as any).error) {
    throw new Error((captureData as any).error);
  }

  // 2) Mark rental as completed only after successful capture
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("rentals")
    .update({
      return_confirmed_at: now,
      status: "completed",
      completed_at: now,
    })
    .eq("id", rentalId);
  if (error) throw mapPvError(error);
}

function mapPvError(error: unknown): Error {
  const msg = (error as any)?.message || "";
  if (msg.includes("PV_INCOMPLETE_HANDOVER")) {
    return new Error("Așteptăm ca ambele părți să completeze procesul verbal de predare (minim 3 poze fiecare).");
  }
  if (msg.includes("PV_INCOMPLETE_RETURN")) {
    return new Error("Așteptăm ca ambele părți să completeze procesul verbal de retur (minim 3 poze fiecare).");
  }
  if (msg.includes("PV_DISPUTE_OPEN")) {
    return new Error("Rezervarea este în verificare. Suportul trebuie să rezolve disputa înainte de a continua.");
  }
  if (msg.includes("PV_LOCKED")) {
    return new Error("Procesul verbal a fost blocat după confirmarea ambelor părți și nu mai poate fi modificat.");
  }
  return error instanceof Error ? error : new Error(String(error));
}

/** One party proposes meeting time + place. */
export async function proposePickup(rentalId: string, time: string, place: string) {
  const { data, error } = await supabase.rpc("propose_pickup", {
    _rental_id: rentalId,
    _pickup_time: time,
    _pickup_place: place,
  });
  if (error) throw error;
  return data;
}

/** The other party confirms — when both agreed, pickup_agreed_at is set server-side. */
export async function confirmPickupArrangement(rentalId: string) {
  const { data, error } = await supabase.rpc("confirm_pickup", { _rental_id: rentalId });
  if (error) throw error;
  // Fire pickup_scheduled notification (email + sms + in-app to both parties)
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "pickup_scheduled" },
  }).catch((e) => console.warn("notify pickup_scheduled failed", e));
  // And the PV pending CTA so both parties know they must complete the inspection
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "pv_pickup_pending" },
  }).catch((e) => console.warn("notify pv_pickup_pending failed", e));
  return data;
}

/** Open a dispute on either handover or return. */
export async function openRentalDispute(rentalId: string, phase: "handover" | "return", reason: string) {
  const { error } = await supabase.rpc("open_rental_dispute", {
    _rental_id: rentalId,
    _phase: phase,
    _reason: reason,
  });
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  supabase.functions.invoke("notify-rental-event", {
    body: {
      rental_id: rentalId,
      event_key: "dispute_opened",
      actor_id: user?.id,
      extra: { reason, phase, actorName: user?.user_metadata?.full_name },
    },
  }).catch((e) => console.warn("notify dispute_opened failed", e));
}

/** Either party requests an early return after handover; must provide a new end date. */
export async function requestEarlyReturn(
  rentalId: string,
  args: { reason: string; newEndDate: string },
) {
  const { data, error } = await supabase.functions.invoke("request-early-return", {
    body: { rental_id: rentalId, reason: args.reason, new_end_date: args.newEndDate },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

/** Counterparty approves or rejects an early return request. */
export async function respondEarlyReturn(
  rentalId: string,
  action: "approve" | "reject",
  options: { response?: string } = {},
) {
  const { data, error } = await supabase.functions.invoke("respond-early-return", {
    body: {
      rental_id: rentalId,
      action,
      response: options.response ?? "",
    },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}
