import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { invokeAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'
import { getAccountDeletionBlocker } from '../_shared/account-deletion-guard.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Token lipsă" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find profile with this token
    const { data: profile, error: findError } = await adminClient
      .from("profiles")
      .select("id, email, deactivation_token_expires_at")
      .eq("deactivation_token", token)
      .single();

    if (findError || !profile) {
      return new Response(JSON.stringify({ error: "Token invalid sau expirat" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(profile.deactivation_token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expirat" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block deletion while rentals, disputes or wallet balance are still open
    const blocker = await getAccountDeletionBlocker(adminClient, profile.id);
    if (blocker) {
      return new Response(JSON.stringify({ error: blocker }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipientEmail = profile.email as string | null;
    if (!recipientEmail) {
      const { data: auth } = await adminClient.auth.admin.getUserById(profile.id);
      recipientEmail = auth?.user?.email ?? null;
    }

    // Permanently delete: hide listings, then remove the auth user (cascades profile & personal data;
    // rental records are kept with anonymized party for legal/accounting history)
    await adminClient.from("products").update({ is_active: false, deleted_at: new Date().toISOString() }).eq("owner_id", profile.id);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile.id);
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(JSON.stringify({ error: "Eroare internă la ștergerea contului" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      if (recipientEmail) {
        await invokeAppEmail({
          body: {
            templateName: "account-deactivated",
            recipientEmail,
            idempotencyKey: `account-deleted-${profile.id}`,
            templateData: {},
          },
        });
      }
    } catch (e) {
      console.error("account-deleted email failed:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Eroare internă" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));
