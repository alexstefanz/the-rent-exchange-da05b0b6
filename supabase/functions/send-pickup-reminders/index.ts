// Cron-invoked: notifies both parties ~12h before agreed pickup time.
// Idempotent via rentals.pickup_reminder_sent_at.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const now = Date.now();
    const lower = new Date(now + 11.5 * 60 * 60 * 1000).toISOString(); // 11h30m
    const upper = new Date(now + 12.5 * 60 * 60 * 1000).toISOString(); // 12h30m

    const { data: rentals, error } = await supabase
      .from("rentals")
      .select(
        "id, owner_id, renter_id, pickup_agreed_at, pickup_location, products(title)",
      )
      .is("pickup_reminder_sent_at", null)
      .is("handover_confirmed_at", null)
      .gte("pickup_agreed_at", lower)
      .lte("pickup_agreed_at", upper);

    if (error) throw error;

    let sent = 0;
    for (const r of rentals ?? []) {
      const productTitle = (r as any).products?.title ?? "produsul";
      const place = (r as any).pickup_location ?? "locul agreat";
      const time = new Date(r.pickup_agreed_at as string).toLocaleString(
        "ro-RO",
        { dateStyle: "short", timeStyle: "short" },
      );

      const baseRows = [r.owner_id, r.renter_id]
        .filter((id): id is string => !!id)
        .map((uid) => ({
          user_id: uid,
          type: "pickup_reminder",
          title_ro: `Predare în ~12h: ${productTitle}`,
          title_en: `Hand-over in ~12h: ${productTitle}`,
          description_ro: `Întâlnire programată ${time}, la ${place}. Pregătește procesul verbal de predare.`,
          description_en: `Meeting scheduled ${time} at ${place}. Get the hand-over inspection ready.`,
          link: `/inchirieri`,
        }));

      if (baseRows.length === 0) continue;

      const { error: insertErr } = await supabase
        .from("notifications")
        .insert(baseRows);
      if (insertErr) {
        console.error("notif insert failed", r.id, insertErr.message);
        continue;
      }

      const { error: markErr } = await supabase
        .from("rentals")
        .update({ pickup_reminder_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      if (markErr) {
        console.error("rental mark failed", r.id, markErr.message);
        continue;
      }
      sent += 1;
    }

    return new Response(
      JSON.stringify({ ok: true, candidates: rentals?.length ?? 0, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-pickup-reminders error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});