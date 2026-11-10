import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@17.7.0";

const stripe = new Stripe(Deno.env.get("STRIPE_LIVE_API_KEY")!, { apiVersion: "2024-12-18.acacia" });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(withCors(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, cryptoProvider);
  } catch (e) {
    console.error("Invalid signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  if (!event.type.startsWith("identity.verification_session.")) return new Response("ignored", { status: 200 });
  const s = event.data.object as Stripe.Identity.VerificationSession;
  const userId = s.metadata?.user_id || s.client_reference_id;
  if (!userId) return new Response("no user", { status: 200 });

  const map: Record<string, Record<string, unknown>> = {
    "identity.verification_session.verified": { identity_status: "verified", identity_verified_at: new Date().toISOString(), identity_last_error: null },
    "identity.verification_session.processing": { identity_status: "processing" },
    "identity.verification_session.requires_input": { identity_status: "requires_input", identity_last_error: s.last_error?.code ?? null },
    "identity.verification_session.canceled": { identity_status: "canceled" },
  };
  const patch = map[event.type];
  if (!patch) return new Response("ignored", { status: 200 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Never downgrade a verified profile from a stale event
  let q = admin.from("profiles").update({ ...patch, identity_session_id: s.id }).eq("id", userId);
  if (event.type !== "identity.verification_session.verified") q = q.neq("identity_status", "verified");
  const { error } = await q;
  if (error) { console.error(error); return new Response("db error", { status: 500 }); }
  return new Response("ok", { status: 200 });
}, "POST, OPTIONS"));
