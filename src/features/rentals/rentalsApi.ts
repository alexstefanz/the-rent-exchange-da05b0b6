import { supabase } from "@/integrations/supabase/client";

interface CreateRentalParams {
  productId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyPrice: number;
  /**
   * Pre-computed total (months + weeks + days tiers).
   * If omitted, falls back to dailyPrice * rentalDays for backwards compatibility.
   */
  subtotal?: number;
  platformFeePercent?: number;
  paymentMethod: string;
  messageToOwner?: string;
}

export async function createRental(params: CreateRentalParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Trebuie să fii autentificat");

  const {
    productId, ownerId, startDate, endDate,
    rentalDays, dailyPrice, platformFeePercent = 5,
    paymentMethod,
  } = params;

  const subtotal = typeof params.subtotal === "number" && params.subtotal > 0
    ? Math.round(params.subtotal * 100) / 100
    : Math.round(dailyPrice * rentalDays * 100) / 100;
  const platformFee = Math.round(subtotal * platformFeePercent / 100 * 100) / 100;
  const ownerPayout = Math.round((subtotal - platformFee) * 100) / 100;

  // Insert rental
  const { data: rental, error } = await supabase
    .from("rentals")
    .insert({
      product_id: productId,
      renter_id: user.id,
      owner_id: ownerId,
      start_date: startDate,
      end_date: endDate,
      rental_days: rentalDays,
      daily_price: dailyPrice,
      subtotal,
      platform_fee: platformFee,
      platform_fee_percent: platformFeePercent,
      owner_payout: ownerPayout,
      payment_method: paymentMethod,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (typeof error.message === "string" && error.message.includes("KYC_REQUIRED")) {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    throw error;
  }

  // NOTE: Notifications, emails and the owner conversation/message are now
  // created ONLY after Stripe confirms the payment hold (see verify-stripe-payment).
  // This ensures the owner is never notified about a request that was never paid.
  return rental;
}

/**
 * NEW FLOW: creates the rental as a request only (no Stripe).
 * - Owner is notified immediately (in-app + email + SMS).
 * - A dedicated rental chat thread is created with the optional message.
 * - The renter pays only AFTER the owner accepts (see {@link payForConfirmedRental}).
 */
export async function createRentalRequest(params: CreateRentalParams) {
  const rental = await createRental(params);

  // 1) Create / get the dedicated rental conversation thread.
  let conversationId: string | null = null;
  try {
    const { data, error } = await supabase.rpc("get_or_create_rental_conversation", {
      p_rental_id: rental.id,
    });
    if (!error && data) conversationId = data as string;
  } catch (e) {
    console.warn("Rental conversation init failed (non-blocking):", e);
  }

  // 2) Insert the first message (custom or auto) so the owner sees context.
  if (conversationId) {
    const { data: { user } } = await supabase.auth.getUser();
    // Only post a chat message if the renter explicitly typed one in the
    // booking form. The generic auto-message is intentionally suppressed —
    // it now happens only after the renter completes payment.
    const customMsg = (params.messageToOwner || "").trim();
    if (customMsg && user) {
      const { data: existingMsgs } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .limit(1);
      if (!existingMsgs || existingMsgs.length === 0) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: customMsg,
        });
      }
    }
  }

  // 3) Notify the owner (in-app + email).
  supabase.functions.invoke("send-rental-notification", { body: { rental_id: rental.id } })
    .catch((e) => console.warn("send-rental-notification failed (non-blocking):", e));
  // 4) SMS to owner via the unified notify-rental-event (event: request_received).
  supabase.functions.invoke("notify-rental-event", {
    body: { rental_id: rental.id, event_key: "request_created" },
  }).catch((e) => console.warn("notify-rental-event request_created failed (non-blocking):", e));

  return rental;
}

/**
 * NEW FLOW: renter clicks "Plătește" on a rental that the owner already accepted.
 * Calls the existing create-checkout-session edge function and returns the Stripe URL.
 */
export async function payForConfirmedRental(rentalId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { rental_id: rentalId },
  });
  if (error) {
    const msg = (error as any)?.message || "";
    const ctxErr = (error as any)?.context?.error;
    if (msg.includes("KYC_REQUIRED") || ctxErr === "KYC_REQUIRED") {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    if (msg.includes("MIN_AMOUNT") || ctxErr === "MIN_AMOUNT") {
      const e = new Error("Suma totală este sub minimul acceptat de procesatorul de plată (2 RON). Cere proprietarului să actualizeze prețul anunțului.");
      (e as any).code = "MIN_AMOUNT";
      throw e;
    }
    throw error;
  }
  if (data?.error) {
    if (data.error === "KYC_REQUIRED") {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    if (data.error === "MIN_AMOUNT") {
      const e = new Error(data.message || "Suma totală este sub minimul acceptat (2 RON).");
      (e as any).code = "MIN_AMOUNT";
      throw e;
    }
    throw new Error(data.error);
  }
  if (!data?.url) throw new Error("Nu s-a putut crea sesiunea de plată");
  return data.url;
}

/**
 * Creates a rental and then initiates a Stripe Checkout session.
 * Returns the Stripe Checkout URL for redirect.
 */
export async function createRentalWithStripeCheckout(params: CreateRentalParams): Promise<string> {
  // First create the rental in DB
  const rental = await createRental(params);

  // Helper to clean up an orphan pending rental if checkout init fails
  const cleanupOrphanRental = async () => {
    try {
      await supabase
        .from("rentals")
        .update({ status: "cancelled", cancellation_reason: "checkout_init_failed" })
        .eq("id", rental.id)
        .eq("status", "pending");
    } catch (cleanupErr) {
      console.error("Cleanup of orphan rental failed (non-blocking):", cleanupErr);
    }
  };

  // Then create a Stripe Checkout session
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { rental_id: rental.id, message_to_owner: params.messageToOwner ?? null },
  });

  if (error) {
    await cleanupOrphanRental();
    const msg = (error as any)?.message || "";
    if (msg.includes("KYC_REQUIRED") || (error as any)?.context?.error === "KYC_REQUIRED") {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    throw error;
  }
  if (data?.error) {
    await cleanupOrphanRental();
    if (data.error === "KYC_REQUIRED") {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    throw new Error(data.error);
  }
  if (!data?.url) {
    await cleanupOrphanRental();
    throw new Error("Nu s-a putut crea sesiunea de plată");
  }

  return data.url;
}

/**
 * ADMIN ONLY — Creates a rental and initiates a Stripe Checkout session in TEST mode.
 * The rental is marked is_test_payment=true and uses sk_test_ key. No real money moves.
 */
export async function createRentalWithStripeTestCheckout(params: CreateRentalParams): Promise<string> {
  const rental = await createRental(params);

  const cleanupOrphanRental = async () => {
    try {
      await supabase
        .from("rentals")
        .update({ status: "cancelled", cancellation_reason: "test_checkout_init_failed" })
        .eq("id", rental.id)
        .eq("status", "pending");
    } catch (cleanupErr) {
      console.error("Cleanup of orphan TEST rental failed (non-blocking):", cleanupErr);
    }
  };

  const { data, error } = await supabase.functions.invoke("create-test-checkout-session", {
    body: { rental_id: rental.id, message_to_owner: params.messageToOwner ?? null },
  });

  if (error) {
    await cleanupOrphanRental();
    throw error;
  }
  if (data?.error) {
    await cleanupOrphanRental();
    throw new Error(data.error);
  }
  if (!data?.url) {
    await cleanupOrphanRental();
    throw new Error("Nu s-a putut crea sesiunea de test");
  }
  return data.url;
}
