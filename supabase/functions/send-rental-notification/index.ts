import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { rental_id } = await req.json();
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

    // Fetch rental
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

    // Fetch product, renter, owner in parallel
    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabaseAdmin.from("products").select("title, images").eq("id", rental.product_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.renter_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.owner_id).single(),
    ]);

    const product = productRes.data;
    const renter = renterRes.data;
    const owner = ownerRes.data;

    // Helper: get email from profiles or fallback to auth.users
    const getEmail = async (userId: string, profileEmail: string | null): Promise<string | null> => {
      if (profileEmail) return profileEmail;
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          // Backfill email into profiles for future use
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

    // Insert transaction
    await supabaseAdmin.from("transactions").insert({
      rental_id: rental.id,
      user_id: rental.renter_id,
      amount: rental.subtotal,
      type: "rental_payment",
      status: "pending",
      description: `Plată închiriere: ${product?.title || "Produs"}`,
      currency: "RON",
    });

    // Insert notifications for both users
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: rental.owner_id,
        type: "rental_request",
        title_ro: `Cerere nouă de închiriere`,
        title_en: `New rental request`,
        description_ro: `${renter?.full_name || "Un utilizator"} dorește să închirieze "${product?.title}" pentru ${rental.rental_days} zile.`,
        description_en: `${renter?.full_name || "A user"} wants to rent "${product?.title}" for ${rental.rental_days} days.`,
        link: `/profile?tab=lendings`,
      },
      {
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: `Cerere trimisă cu succes`,
        title_en: `Request sent successfully`,
        description_ro: `Cererea ta pentru "${product?.title}" a fost trimisă proprietarului. Vei fi notificat când va răspunde.`,
        description_en: `Your request for "${product?.title}" has been sent to the owner. You'll be notified when they respond.`,
        link: `/profile?tab=rentals`,
      },
    ]);

    // Send emails via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && (ownerEmail || renterEmail)) {
      const sendEmail = async (to: string, subject: string, html: string) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "RentNow <onboarding@resend.dev>",
              to: [to],
              subject,
              html,
            }),
          });
          const result = await res.text();
          console.log(`Email sent to ${to}:`, result);
        } catch (e) {
          console.error("Email send error:", e);
        }
      };

      if (ownerEmail) {
        await sendEmail(
          ownerEmail,
          `Cerere nouă de închiriere - ${product?.title}`,
          `<h2>Ai o cerere nouă de închiriere!</h2>
          <p><strong>${renter?.full_name || "Un utilizator"}</strong> dorește să închirieze <strong>${product?.title}</strong>.</p>
          <p><strong>Perioadă:</strong> ${rental.start_date} → ${rental.end_date} (${rental.rental_days} zile)</p>
          <p><strong>Total:</strong> ${rental.subtotal} RON</p>
          <p><strong>Vei primi:</strong> ${rental.owner_payout} RON</p>
          <p>Accesează platforma pentru a accepta sau refuza cererea.</p>`
        );
      }

      if (renterEmail) {
        await sendEmail(
          renterEmail,
          `Cererea ta a fost trimisă - ${product?.title}`,
          `<h2>Cererea ta a fost trimisă!</h2>
          <p>Ai solicitat închirierea <strong>${product?.title}</strong>.</p>
          <p><strong>Perioadă:</strong> ${rental.start_date} → ${rental.end_date} (${rental.rental_days} zile)</p>
          <p><strong>Total de plată:</strong> ${rental.subtotal} RON</p>
          <p>Vei fi notificat când proprietarul va răspunde la cererea ta.</p>`
        );
      }
    }

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
