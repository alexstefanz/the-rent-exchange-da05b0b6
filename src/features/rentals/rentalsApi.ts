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
