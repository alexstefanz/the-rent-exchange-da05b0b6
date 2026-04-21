import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxRequests = 5, windowSec = 60): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function formatDateRo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rental_id } = await req.json();

    // Rate limit: 5 per minute per rental
    if (!checkRateLimit(`rental:${rental_id}`)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rental, error: rentalError } = await supabaseAdmin
      .from("rentals")
      .select("*")
      .eq("id", rental_id)
      .single();

    if (rentalError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency guard: if we already notified the owner about this rental,
    // skip everything (verify-stripe-payment may run again on success-page refresh).
    const { data: existingNotification } = await supabaseAdmin
      .from("notifications")
      .select("id")
      .eq("user_id", rental.owner_id)
      .eq("type", "rental_request")
      .ilike("link", `%rental_id=${rental.id}%`)
      .limit(1)
      .maybeSingle();

    if (existingNotification) {
      console.log(`[send-rental-notification] Already notified for rental ${rental.id} — skipping.`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabaseAdmin.from("products").select("title, images").eq("id", rental.product_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.renter_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.owner_id).single(),
    ]);

    const product = productRes.data;
    const renter = renterRes.data;
    const owner = ownerRes.data;

    const getEmail = async (userId: string, profileEmail: string | null): Promise<string | null> => {
      if (profileEmail) return profileEmail;
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          await supabaseAdmin.from("profiles").update({ email: data.user.email }).eq("id", userId);
          return data.user.email;
        }
      } catch (e) {
        console.error("Error fetching auth user email:", e);
      }
      return null;
    };

    const [ownerEmail, renterEmail] = await Promise.all([
      getEmail(rental.owner_id, owner?.email || null),
      getEmail(rental.renter_id, renter?.email || null),
    ]);

    // Insert transaction (status reflects the Stripe authorization hold).
    {
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("rental_id", rental.id)
        .eq("type", "rental_payment")
        .limit(1)
        .maybeSingle();

      if (!existingTx) {
        await supabaseAdmin.from("transactions").insert({
          rental_id: rental.id,
          user_id: rental.renter_id,
          amount: rental.subtotal,
          type: "rental_payment",
          status: "authorized",
          description: `Plată închiriere: ${product?.title || "Produs"}`,
          currency: "RON",
        });
      }
    }

    // Insert notifications (in-app)
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: rental.owner_id,
        type: "rental_request",
        title_ro: `Cerere nouă de închiriere`,
        title_en: `New rental request`,
        description_ro: `${renter?.full_name || "Un utilizator"} a plătit și dorește să închirieze "${product?.title}" pentru ${rental.rental_days} zile.`,
        description_en: `${renter?.full_name || "A user"} paid and wants to rent "${product?.title}" for ${rental.rental_days} days.`,
        link: `/anunturi?rental_id=${rental.id}`,
      },
      {
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: `Cerere trimisă cu succes`,
        title_en: `Request sent successfully`,
        description_ro: `Plata ta a fost autorizată. Cererea pentru "${product?.title}" a fost trimisă proprietarului.`,
        description_en: `Your payment has been authorized. The request for "${product?.title}" has been sent to the owner.`,
        link: `/rezervari?rental_id=${rental.id}`,
      },
    ]);

    // Send branded transactional emails via Lovable Cloud queue
    const productTitle = product?.title || "Produs";
    const renterName = renter?.full_name || "Un utilizator";
    const startStr = formatDateRo(rental.start_date);
    const endStr = formatDateRo(rental.end_date);

    const sendBranded = async (templateName: string, recipientEmail: string, templateData: Record<string, unknown>, idempotencyKey: string) => {
      try {
        const { error } = await supabaseAdmin.functions.invoke("send-transactional-email", {
          body: { templateName, recipientEmail, idempotencyKey, templateData },
        });
        if (error) console.error(`[send-rental-notification] ${templateName} -> ${recipientEmail} failed:`, error);
        else console.log(`[send-rental-notification] ${templateName} queued for ${recipientEmail}`);
      } catch (e) {
        console.error(`[send-rental-notification] invoke error for ${templateName}:`, e);
      }
    };

    const tasks: Promise<void>[] = [];
    if (ownerEmail) {
      tasks.push(sendBranded(
        "rental-request-owner",
        ownerEmail,
        { renterName, productTitle, startDate: startStr, endDate: endStr },
        `rental-req-owner-${rental.id}`
      ));
    }
    if (renterEmail) {
      tasks.push(sendBranded(
        "rental-request-renter",
        renterEmail,
        { productTitle, startDate: startStr, endDate: endStr },
        `rental-req-renter-${rental.id}`
      ));
    }
    await Promise.all(tasks);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
