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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user from JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Save token using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        deactivation_token: token,
        deactivation_token_expires_at: expiresAt,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error saving token:", updateError);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get site URL for the confirmation link
    const siteUrl = req.headers.get("origin") || "https://rentli.ro";
    const confirmLink = `${siteUrl}/dezactivare-cont?token=${token}`;

    // Send via standard transactional email pipeline (queued + branded template)
    const { error: emailError } = await invokeAppEmail({
      body: {
        templateName: "account-deactivation",
        recipientEmail: user.email,
        idempotencyKey: `account-deactivation-${user.id}-${token}`,
        templateData: { confirmationLink: confirmLink },
      },
    });
    if (emailError) {
      console.error("app email send error:", emailError);
      return new Response(JSON.stringify({ error: "Could not send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
