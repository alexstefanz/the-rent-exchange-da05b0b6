import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { invokeAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: rentals, error } = await supabase
      .from("rentals")
      .select("id, renter_id, owner_id, end_date, product_id, products(title)")
      .eq("status", "active")
      .eq("end_date", today);

    if (error) throw error;

    let notified = 0;
    for (const r of (rentals || []) as any[]) {
      const productTitle = r.products?.title || "produsul închiriat";

      // In-app notification (idempotent-ish: skip if already exists today)
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", r.renter_id)
        .eq("type", "return_reminder")
        .gte("created_at", `${today}T00:00:00Z`)
        .ilike("link", `%${r.id}%`)
        .maybeSingle();

      if (existing) continue;

      await supabase.from("notifications").insert({
        user_id: r.renter_id,
        type: "return_reminder",
        title_ro: "Astăzi returnezi produsul 📦",
        title_en: "Return reminder for today 📦",
        description_ro: `Astăzi este ultima zi pentru "${productTitle}". Contactează proprietarul pentru returnare.`,
        description_en: `Today is the last day for "${productTitle}". Contact the owner to arrange return.`,
        link: `/rezervari?rental_id=${r.id}`,
      });
      notified++;

      // SMS to renter (best-effort)
      try {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", r.owner_id)
          .maybeSingle();

        await supabase.functions.invoke("send-sms-notification", {
          body: {
            templateKey: "return_reminder",
            userId: r.renter_id,
            rentalId: r.id,
            variables: {
              productTitle,
              ownerName: ownerProfile?.full_name || "proprietarul",
              link: `https://rentli.ro/rezervari?rental_id=${r.id}`,
            },
            idempotencyKey: `return_reminder:${r.id}:${today}`,
          },
        });
      } catch (e) {
        console.error("[notify-return-day] SMS invoke failed:", e);
      }

      // Email to renter (respect notification_preferences)
      try {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_transactional")
          .eq("user_id", r.renter_id)
          .maybeSingle();
        if (prefs?.email_transactional !== false) {
          const { data: renterProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", r.renter_id)
            .maybeSingle();
          if (renterProfile?.email) {
            await invokeAppEmail({
              body: {
                templateName: "return-reminder",
                recipientEmail: renterProfile.email,
                idempotencyKey: `return-reminder-${r.id}-${today}`,
                templateData: {
                  name: renterProfile.full_name || undefined,
                  productTitle,
                  endDate: r.end_date,
                },
              },
            });
          }
        }
      } catch (e) {
        console.error("[notify-return-day] email invoke failed:", e);
      }
    }

    return new Response(JSON.stringify({ processed: rentals?.length || 0, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-return-day error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));