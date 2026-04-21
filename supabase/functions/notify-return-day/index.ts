import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
});