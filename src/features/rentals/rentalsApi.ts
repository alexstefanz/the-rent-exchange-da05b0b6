import { supabase } from "@/integrations/supabase/client";

interface CreateRentalParams {
  productId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyPrice: number;
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
    paymentMethod, messageToOwner,
  } = params;

  const subtotal = dailyPrice * rentalDays;
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

  if (error) throw error;

  // Create conversation + message if provided
  if (messageToOwner?.trim()) {
    const { data: conversation } = await supabase
      .from("conversations")
      .insert({
        product_id: productId,
        buyer_id: user.id,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: messageToOwner.trim(),
      });
    }
  }

  // Call edge function for notifications + emails
  try {
    await supabase.functions.invoke("send-rental-notification", {
      body: { rental_id: rental.id },
    });
  } catch (e) {
    console.error("Notification error (non-blocking):", e);
  }

  return rental;
}

/**
 * Creates a rental and then initiates a Stripe Checkout session.
 * Returns the Stripe Checkout URL for redirect.
 */
export async function createRentalWithStripeCheckout(params: CreateRentalParams): Promise<string> {
  // First create the rental in DB
  const rental = await createRental(params);

  // Then create a Stripe Checkout session
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { rental_id: rental.id },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error("Nu s-a putut crea sesiunea de plată");

  return data.url;
}
