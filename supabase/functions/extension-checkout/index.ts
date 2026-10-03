import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// action "create": start Stripe Checkout for an approved extension.
// action "verify": confirm the session was paid and apply the extension.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: auth } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = auth?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const body = await req.json();

    if (body.action === "verify") {
      const session = await stripe.checkout.sessions.retrieve(String(body.session_id));
      const extId = session.metadata?.extension_id;
      if (!extId || session.metadata?.renter_id !== user.id) return json({ error: "Invalid session" }, 400);
      if (session.payment_status !== "paid") return json({ paid: false });
      const { error } = await admin.rpc("complete_rental_extension_card_payment", { _extension_id: extId, _session_id: session.id });
      if (error) return json({ error: error.message }, 400);
      return json({ paid: true });
    }

    const { data: ext } = await admin.from("rental_extensions").select("*").eq("id", body.extension_id).maybeSingle();
    if (!ext) return json({ error: "Prelungirea nu a fost găsită." }, 404);
    const { data: rental } = await admin.from("rentals").select("id, public_id, renter_id, products:product_id(title)").eq("id", ext.rental_id).single();
    if (!rental || rental.renter_id !== user.id) return json({ error: "Doar chiriașul poate plăti." }, 403);
    if (ext.status !== "approved" || ext.payment_status !== "pending") return json({ error: "Prelungirea nu așteaptă plata." }, 400);
    const total = Math.round(Number(ext.total_amount) * 100) / 100;
    if (total < 2) return json({ error: "Suma este sub minimul de 2 RON acceptat la plata cu cardul. Folosește portofelul." }, 400);

    const origin = req.headers.get("origin") || "https://rentli.ro";
    const back = `${origin}/inchirieri/${rental.public_id}`;
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data[0]?.id;
    const meta = { extension_id: ext.id, rental_id: rental.id, renter_id: user.id, type: "rental_extension" };
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "ron",
          product_data: {
            name: `Prelungire ${rental.public_id} — +${ext.approved_days} zile`,
            description: `${(rental as any).products?.title || "Închiriere"} · până la ${ext.approved_end_date}`,
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      payment_intent_data: { metadata: meta },
      metadata: meta,
      success_url: `${back}?ext_session={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error("extension-checkout error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
