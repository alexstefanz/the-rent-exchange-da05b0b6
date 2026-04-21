import { supabase } from "@/integrations/supabase/client";

export type PaymentTimelineEvent = {
  timestamp: string;
  label: string;
  source: "db" | "stripe";
  details?: string;
  variant?: "default" | "success" | "warning" | "error";
};

export type PaymentDiscrepancy = {
  severity: "warning" | "error" | "info";
  message: string;
  code: string;
};

export type PaymentStripeData = {
  payment_intent: {
    id: string;
    status: string;
    amount: number;
    amount_received: number;
    amount_capturable: number;
    currency: string;
    capture_method: string;
    created: string;
  };
  charge: {
    id: string;
    amount_refunded: number;
    receipt_url: string | null;
    paid: boolean;
    card_brand: string | null;
    card_last4: string | null;
    last_error: string | null;
  } | null;
  refunds: Array<{
    id: string;
    amount: number;
    status: string;
    reason: string | null;
    created: string;
  }>;
};

export type PaymentTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string | null;
  processed_at: string | null;
  user_id: string | null;
};

export type RentalPaymentStatus = {
  rental: {
    id: string;
    status: string;
    payment_status: string;
    subtotal: number;
    platform_fee: number;
    owner_payout: number;
    rental_days: number;
    start_date: string;
    end_date: string;
    payment_intent_id: string | null;
    cancellation_reason: string | null;
  };
  events: PaymentTimelineEvent[];
  stripe: PaymentStripeData | null;
  transactions: PaymentTransaction[] | null;
  discrepancies: PaymentDiscrepancy[];
  is_admin: boolean;
  is_synced: boolean;
};

export async function fetchRentalPaymentStatus(rentalId: string): Promise<RentalPaymentStatus> {
  const { data, error } = await supabase.functions.invoke("get-rental-payment-status", {
    body: { rental_id: rentalId },
  });
  if (error) throw error;
  return data as RentalPaymentStatus;
}