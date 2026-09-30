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
  return_pv_owner_signed_at?: string | null;
  return_pv_renter_signed_at?: string | null;
}

export async function getOwnerRentals(ownerId: string): Promise<OwnerRental[]> {
  const { data, error } = await supabase.rpc("get_owner_rentals", {
    owner_uuid: ownerId,
  });

  if (error) throw error;
  const rentals = (data || []) as OwnerRental[];
  const ids = rentals.map((r) => r.id);
  if (ids.length > 0) {
    const { data: pvs } = await supabase
      .from("rental_pv_documents")
      .select("rental_id, owner_signed_at, renter_signed_at")
      .eq("phase", "return")
      .in("rental_id", ids);
    const pvMap: Record<string, { owner: string | null; renter: string | null }> =
      Object.fromEntries((pvs || []).map((p: any) => [p.rental_id, { owner: p.owner_signed_at, renter: p.renter_signed_at }]));
    for (const r of rentals) {
      r.return_pv_owner_signed_at = pvMap[r.id]?.owner ?? null;
      r.return_pv_renter_signed_at = pvMap[r.id]?.renter ?? null;
    }
  }
  return rentals;
}

export async function respondToRental(rentalId: string, action: "accept" | "reject", reason?: string) {
  const { data, error } = await supabase.functions.invoke("respond-rental-request", {
    body: { rental_id: rentalId, action, reason },
  });
  if (error) {
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) throw new Error(body.error);
    } catch (_parseErr) {
      // fall back to original error below
    }
    throw error;
  }
  return data;
}

export async function confirmHandover(rentalId: string) {
  const { error } = await supabase.rpc("confirm_rental_handover", {
    _rental_id: rentalId,
  });
  if (error) throw mapPvError(error);
  // Note: handover_confirmed notification is fired by the DB trigger
  // `rentals_notify_status` when `handover_confirmed_at` transitions from NULL.
  // Do NOT invoke notify-rental-event here — it causes duplicate emails.
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
  const { error } = await supabase.rpc("confirm_rental_return", {
    _rental_id: rentalId,
  });
  if (error) throw mapPvError(error);

  // Fire completion + review reminder notifications (best-effort, non-blocking)
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "rental_completed" },
  }).catch((e) => console.warn("notify rental_completed failed", e));
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rentalId, event_key: "review_reminder" },
  }).catch((e) => console.warn("notify review_reminder failed", e));
}

function mapPvError(error: unknown): Error {
  const msg = (error as any)?.message || "";
  if (msg.includes("PV_INCOMPLETE_HANDOVER")) {
    return new Error("Așteptăm ca ambele părți să completeze procesul verbal de predare (minim 3 poze fiecare).");
  }
  if (msg.includes("PV_INCOMPLETE_RETURN")) {
    return new Error("Așteptăm ca ambele părți să completeze procesul verbal de retur (minim 3 poze fiecare).");
  }
  if (msg.includes("DISPUTE_OPEN")) {
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
