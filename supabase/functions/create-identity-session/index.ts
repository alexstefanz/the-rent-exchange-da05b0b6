import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@17.7.0";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data, error } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (error || !data?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = data.claims.sub as string;

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prof } = await admin.from("profiles").select("identity_status").eq("id", userId).single();
    if (prof?.identity_status === "verified") return json({ already_verified: true });

    const body = await req.json().catch(() => ({}));
    const origin = typeof body?.return_origin === "string" && /^https:\/\/([a-z0-9-]+\.)*(rentli\.ro|lovable\.app)$/.test(body.return_origin)
      ? body.return_origin : "https://rentli.ro";

    const stripe = new Stripe(Deno.env.get("STRIPE_LIVE_API_KEY")!, { apiVersion: "2024-12-18.acacia" });
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: { document: { require_matching_selfie: true, require_live_capture: true, allowed_types: ["id_card", "passport", "driving_license"] } },
      metadata: { user_id: userId },
      client_reference_id: userId,
      return_url: `${origin}/verificare?done=1`,
    });

    await admin.from("profiles").update({ identity_status: "pending", identity_session_id: session.id, identity_last_error: null }).eq("id", userId);
    return json({ url: session.url });
  } catch (e) {
    console.error("create-identity-session", e);
    return json({ error: "Nu am putut porni verificarea." }, 500);
  }
});
