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
    const { rental_id, action, reason } = await req.json();

    if (!rental_id || !["accept", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "rental_id and action (accept/reject) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is the owner
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch rental and verify ownership
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

    if (rental.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not the owner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.status !== "pending") {
      return new Response(JSON.stringify({ error: "Rental is not pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update rental status
    const newStatus = action === "accept" ? "confirmed" : "cancelled";
    const updateData: Record<string, unknown> = { status: newStatus };
    if (action === "accept") {
      updateData.confirmed_at = new Date().toISOString();
    } else {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason || "Refuzat de proprietar";
    }

    await supabaseAdmin.from("rentals").update(updateData).eq("id", rental_id);

    // Fetch product and profiles
    const [productRes, renterRes, ownerRes] = await Promise.all([
      supabaseAdmin.from("products").select("title").eq("id", rental.product_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.renter_id).single(),
      supabaseAdmin.from("profiles").select("full_name, email").eq("id", rental.owner_id).single(),
    ]);

    const product = productRes.data;
    const renter = renterRes.data;
    const owner = ownerRes.data;

    // Get email helper
    const getEmail = async (userId: string, profileEmail: string | null): Promise<string | null> => {
      if (profileEmail) return profileEmail;
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email) {
          await supabaseAdmin.from("profiles").update({ email: data.user.email }).eq("id", userId);
          return data.user.email;
        }
      } catch (e) {
        console.error("Error fetching auth email:", e);
      }
      return null;
    };

    const renterEmail = await getEmail(rental.renter_id, renter?.email || null);

    if (action === "accept") {
      // Notify renter: accepted
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost acceptată! 🎉",
        title_en: "Your request was accepted! 🎉",
        description_ro: `${owner?.full_name || "Proprietarul"} a acceptat cererea ta pentru "${product?.title}". Poți discuta detaliile de predare.`,
        description_en: `${owner?.full_name || "The owner"} accepted your request for "${product?.title}". You can discuss pickup details.`,
        link: "/profile?tab=rentals",
      });

      // Update transaction status
      await supabaseAdmin
        .from("transactions")
        .update({ status: "confirmed" })
        .eq("rental_id", rental_id)
        .eq("status", "pending");
    } else {
      // Notify renter: rejected
      await supabaseAdmin.from("notifications").insert({
        user_id: rental.renter_id,
        type: "rental_confirmation",
        title_ro: "Cererea ta a fost refuzată",
        title_en: "Your request was declined",
        description_ro: `${owner?.full_name || "Proprietarul"} a refuzat cererea pentru "${product?.title}".${reason ? ` Motiv: ${reason}` : ""}`,
        description_en: `${owner?.full_name || "The owner"} declined your request for "${product?.title}".${reason ? ` Reason: ${reason}` : ""}`,
        link: "/profile?tab=rentals",
      });
    }

    // Send email to renter
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && renterEmail) {
      const subject = action === "accept"
        ? `Cererea ta a fost acceptată - ${product?.title}`
        : `Cererea ta a fost refuzată - ${product?.title}`;
      
      const html = action === "accept"
        ? `<h2>Cererea ta a fost acceptată! 🎉</h2>
           <p><strong>${owner?.full_name}</strong> a acceptat cererea ta pentru <strong>${product?.title}</strong>.</p>
           <p><strong>Perioadă:</strong> ${rental.start_date} → ${rental.end_date} (${rental.rental_days} zile)</p>
           <p><strong>Total:</strong> ${rental.subtotal} RON</p>
           <p>Accesează platforma pentru a discuta detaliile de predare.</p>`
        : `<h2>Cererea ta a fost refuzată</h2>
           <p><strong>${owner?.full_name}</strong> a refuzat cererea pentru <strong>${product?.title}</strong>.</p>
           ${reason ? `<p><strong>Motiv:</strong> ${reason}</p>` : ""}
           <p>Poți căuta alte produse similare pe platformă.</p>`;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RentNow <onboarding@resend.dev>",
            to: [renterEmail],
            subject,
            html,
          }),
        });
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
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
