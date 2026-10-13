import { invokeAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    // Deactivate account
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        is_deactivated: true,
        deactivation_token: null,
        deactivation_token_expires_at: null,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error deactivating:", updateError);
      return new Response(JSON.stringify({ error: "Eroare internă" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send confirmation email (fire-and-forget; do not fail the deactivation)
    try {
      let recipientEmail = profile.email as string | null;
      if (!recipientEmail) {
        const { data: auth } = await adminClient.auth.admin.getUserById(profile.id);
        recipientEmail = auth?.user?.email ?? null;
      }
      if (recipientEmail) {
        await invokeAppEmail({
          body: {
            templateName: "account-deactivated",
            recipientEmail,
            idempotencyKey: `account-deactivated-${profile.id}`,
            templateData: {},
          },
        });
      }
    } catch (e) {
      console.error("account-deactivated email failed:", e);
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
});
