import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEST_EMAIL = "z.alexstefan@gmail.com";

const TEST_TEMPLATES: Record<string, { templateName: string; templateData?: Record<string, any> }> = {
  welcome: { templateName: 'welcome', templateData: { name: 'Alexandru' } },
  review_received: { templateName: 'review-received', templateData: { reviewerName: 'Maria Popescu', rating: 5, comment: 'Foarte bun, exact ca în poze!' } },
  product_published: { templateName: 'product-published', templateData: { productTitle: 'Canon EOS R5 - Body' } },
  rental_new_owner: { templateName: 'rental-request-owner', templateData: { renterName: 'Maria Popescu', productTitle: 'Canon EOS R5 - Body', startDate: '1 apr 2026', endDate: '5 apr 2026' } },
  rental_new_renter: { templateName: 'rental-request-renter', templateData: { productTitle: 'Canon EOS R5 - Body', startDate: '1 apr 2026', endDate: '5 apr 2026' } },
  message_new: { templateName: 'new-message', templateData: { senderName: 'Maria Popescu', productTitle: 'Canon EOS R5 - Body', messagePreview: 'Bună, este disponibil weekendul acesta?' } },
  cancellation_owner: { templateName: 'cancellation-owner', templateData: { renterName: 'Maria Popescu', productTitle: 'Canon EOS R5 - Body', reason: 'Am găsit altceva' } },
  cancellation_renter: { templateName: 'cancellation-renter', templateData: { productTitle: 'Canon EOS R5 - Body' } },
  password_changed: { templateName: 'password-changed' },
  rental_accepted: { templateName: 'rental-accepted', templateData: { productTitle: 'Canon EOS R5 - Body', ownerName: 'Ion Ionescu', startDate: '1 apr 2026', endDate: '5 apr 2026' } },
  rental_rejected: { templateName: 'rental-rejected', templateData: { productTitle: 'Canon EOS R5 - Body', ownerName: 'Ion Ionescu' } },
  deactivation: { templateName: 'account-deactivation', templateData: { confirmationLink: 'https://rentli.ro/dezactivare-cont?token=test-token-123' } },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    if (!type || !TEST_TEMPLATES[type]) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Available: ${Object.keys(TEST_TEMPLATES).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const testConfig = TEST_TEMPLATES[type];

    // Use service role key as both apikey and auth token
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: testConfig.templateName,
        recipientEmail: TEST_EMAIL,
        idempotencyKey: `test-${type}-${Date.now()}`,
        templateData: testConfig.templateData || {},
      },
    });

    if (error) {
      console.error('Error invoking send-transactional-email:', error);
      // Try to get more details from the error context
      const errorBody = error?.context ? await error.context.text?.() : null;
      console.error('Error details:', errorBody);
      throw new Error(errorBody || error.message || 'Failed to invoke send-transactional-email');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return new Response(
      JSON.stringify({ success: true, type, result: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
