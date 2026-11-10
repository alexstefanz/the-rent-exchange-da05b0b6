import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
// Cron-invoked: notifies both parties ~24h before rental end_date.
// Idempotent via notification_audit_log (event_key = return_reminder_24h).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      { auth: { persistSession: false } },
    );

    // Tomorrow window (UTC date).
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const isoDate = tomorrow.toISOString().slice(0, 10);

    const { data: rentals, error } = await supabase
      .from("rentals")
      .select("id")
      .eq("status", "active")
      .eq("end_date", isoDate);
    if (error) throw error;

    let sent = 0;
    for (const r of rentals ?? []) {
      // Idempotency check via notification_audit_log
      const { data: already } = await supabase
        .from("notification_audit_log")
        .select("id")
        .eq("rental_id", r.id)
        .eq("event_key", "return_reminder_24h")
        .in("status", ["sent", "delivered"])
        .limit(1)
        .maybeSingle();
      if (already) continue;

      const { error: invokeErr } = await supabase.functions.invoke("notify-rental-event", {
        body: { rental_id: r.id, event_key: "return_reminder_24h" },
      });
      if (invokeErr) {
        console.error("notify return_reminder failed", r.id, invokeErr.message);
        continue;
      }
      sent += 1;
    }

    return new Response(
      JSON.stringify({ ok: true, candidates: rentals?.length ?? 0, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-return-reminders error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}, "POST, OPTIONS"));