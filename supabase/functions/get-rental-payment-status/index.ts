import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DiscrepancyItem {
  severity: "warning" | "error" | "info";
  message: string;
  code: string;
}

interface TimelineEvent {
  timestamp: string;
  label: string;
  source: "db" | "stripe";
  details?: string;
  variant?: "default" | "success" | "warning" | "error";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data: authData } = await supabaseAuth.auth.getUser(token);
    const user = authData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = body?.rental_id as string | undefined;
    if (!rentalId) {
      return new Response(JSON.stringify({ error: "rental_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch rental
    const { data: rental, error: rentalErr } = await supabaseAdmin
      .from("rentals")
      .select("*")
      .eq("id", rentalId)
      .maybeSingle();

    if (rentalErr || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: admin OR participant
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleData;
    const isParticipant = rental.renter_id === user.id || rental.owner_id === user.id;

    if (!isAdmin && !isParticipant) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch transactions
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("rental_id", rentalId)
      .order("created_at", { ascending: true });

    // Fetch Stripe data
    let stripeData: any = null;
    const discrepancies: DiscrepancyItem[] = [];

    if (rental.payment_intent_id) {
      try {
        const stripeKey = rental.is_test_payment
          ? (Deno.env.get("STRIPE_TEST_SECRET_KEY") || "")
          : (Deno.env.get("STRIPE_SECRET_KEY") || "");
        const stripe = new Stripe(stripeKey, {
          apiVersion: "2025-08-27.basil",
        });
        const pi = await stripe.paymentIntents.retrieve(rental.payment_intent_id, {
          expand: ["latest_charge", "latest_charge.refunds"],
        });
        const charge: any = pi.latest_charge && typeof pi.latest_charge === "object"
          ? pi.latest_charge
          : null;
        const pmDetails = charge?.payment_method_details?.card;

        stripeData = {
          payment_intent: {
            id: pi.id,
            status: pi.status,
            amount: pi.amount / 100,
            amount_received: (pi.amount_received ?? 0) / 100,
            amount_capturable: (pi.amount_capturable ?? 0) / 100,
            currency: pi.currency,
            capture_method: pi.capture_method,
            created: new Date(pi.created * 1000).toISOString(),
          },
          charge: charge
            ? {
                id: charge.id,
                amount_refunded: (charge.amount_refunded ?? 0) / 100,
                receipt_url: charge.receipt_url,
                paid: charge.paid,
                card_brand: pmDetails?.brand ?? null,
                card_last4: pmDetails?.last4 ?? null,
                last_error: pi.last_payment_error?.message ?? null,
              }
            : null,
          refunds: charge?.refunds?.data?.map((r: any) => ({
            id: r.id,
            amount: r.amount / 100,
            status: r.status,
            reason: r.reason,
            created: new Date(r.created * 1000).toISOString(),
          })) ?? [],
        };

        // Discrepancy detection
        const piStatus = pi.status;
        const dbPay = rental.payment_status;

        if (dbPay === "authorized" && piStatus === "succeeded") {
          discrepancies.push({
            severity: "warning",
            code: "DB_AUTH_STRIPE_SUCCEEDED",
            message: "DB marchează plata ca 'authorized' dar Stripe arată 'succeeded' (capturată).",
          });
        }
        if (dbPay === "captured" && piStatus !== "succeeded") {
          discrepancies.push({
            severity: "error",
            code: "DB_CAPTURED_STRIPE_NOT",
            message: `DB zice 'captured' dar Stripe e '${piStatus}'.`,
          });
        }
        if (rental.refunded_at && (charge?.amount_refunded ?? 0) === 0) {
          discrepancies.push({
            severity: "warning",
            code: "DB_REFUND_NO_STRIPE",
            message: "DB are 'refunded_at' dar Stripe nu arată refund.",
          });
        }
        if (dbPay === "captured") {
          const hasPayout = (transactions || []).some(
            (t) => t.type === "owner_payout" && t.status === "completed",
          );
          if (!hasPayout) {
            discrepancies.push({
              severity: "warning",
              code: "CAPTURED_NO_PAYOUT_TX",
              message: "Plată capturată dar lipsește tranzacție 'owner_payout' completed.",
            });
          }
        }
        if (Math.abs(pi.amount / 100 - Number(rental.subtotal)) > 0.01) {
          discrepancies.push({
            severity: "warning",
            code: "AMOUNT_MISMATCH",
            message: `Sumă PI (${pi.amount / 100}) != subtotal DB (${rental.subtotal}).`,
          });
        }
        if (pi.last_payment_error?.message) {
          discrepancies.push({
            severity: "error",
            code: "STRIPE_LAST_ERROR",
            message: `Stripe error: ${pi.last_payment_error.message}`,
          });
        }
      } catch (e: any) {
        discrepancies.push({
          severity: "error",
          code: "STRIPE_FETCH_FAILED",
          message: `Nu s-a putut obține Stripe PI: ${e?.message ?? "unknown"}`,
        });
      }
    } else {
      discrepancies.push({
        severity: "info",
        code: "NO_PAYMENT_INTENT",
        message: "Rezervarea nu are payment_intent_id (probabil neplătită încă).",
      });
    }

    // Build timeline events
    const events: TimelineEvent[] = [];
    const push = (ts: string | null | undefined, label: string, variant?: TimelineEvent["variant"], details?: string) => {
      if (ts) events.push({ timestamp: ts, label, source: "db", variant, details });
    };
    push(rental.created_at, "Cerere creată", "default");
    push(rental.authorized_at, `Plată autorizată (${rental.subtotal} RON)`, "success");
    push(rental.confirmed_at, "Cerere acceptată de proprietar", "success");
    push(rental.handover_confirmed_at, "Predare confirmată", "success");
    push(rental.captured_at, "Fonduri capturate de la Stripe", "success");
    push(rental.return_confirmed_at, "Returnare confirmată", "success");
    push(rental.completed_at, "Tranzacție finalizată", "success");
    push(rental.refunded_at, "Refund executat", "warning");
    push(rental.cancelled_at, `Cerere anulată${rental.cancellation_reason ? `: ${rental.cancellation_reason}` : ""}`, "error");
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Strip raw Stripe + transactions for non-admin
    const responsePayload: any = {
      rental: {
        id: rental.id,
        status: rental.status,
        payment_status: rental.payment_status,
        subtotal: rental.subtotal,
        platform_fee: rental.platform_fee,
        owner_payout: rental.owner_payout,
        rental_days: rental.rental_days,
        start_date: rental.start_date,
        end_date: rental.end_date,
        payment_intent_id: isAdmin ? rental.payment_intent_id : null,
        cancellation_reason: rental.cancellation_reason,
      },
      events,
      stripe: isAdmin ? stripeData : null,
      transactions: isAdmin ? transactions ?? [] : null,
      discrepancies: isAdmin ? discrepancies : discrepancies.filter((d) => d.severity === "info"),
      is_admin: isAdmin,
      // Payment receipt is visible only to the payer (renter) and admins.
      receipt_url: (isAdmin || rental.renter_id === user.id) ? ((stripeData as any)?.charge?.receipt_url ?? null) : null,
      is_synced: discrepancies.filter((d) => d.severity !== "info").length === 0,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("get-rental-payment-status error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});