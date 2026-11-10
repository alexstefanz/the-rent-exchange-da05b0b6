import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { requireServiceCaller, unauthorizedResponse } from "../_shared/authGuard.ts";
// Cron-invoked hourly: notifies both parties ~2h before rental deadline (22:00 Europe/Bucharest on end_date).
// Idempotent via notification_audit_log (event_key = return_reminder_2h).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_HOUR = 22; // 22:00 Europe/Bucharest = ~2h before midnight deadline

function bucharestNowParts(): { hour: number; date: string } {
  // Use Intl with Europe/Bucharest TZ to correctly handle DST
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    hour: parseInt(get("hour"), 10),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

Deno.serve(withCors(async (req) => {
  // Cron/internal only: service-role key required.
  if (!(await requireServiceCaller(req))) return unauthorizedResponse({ "Content-Type": "application/json" });
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const { hour, date } = bucharestNowParts();

    if (!force && hour !== TARGET_HOUR) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, hour, date }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: rentals, error } = await supabase
      .from("rentals")
      .select("id")
      .eq("status", "active")
      .eq("end_date", date)
      .is("return_confirmed_at", null);
    if (error) throw error;

    let sent = 0;
    for (const r of rentals ?? []) {
      const { data: already } = await supabase
        .from("notification_audit_log")
        .select("id")
        .eq("rental_id", r.id)
        .eq("event_key", "return_reminder_2h")
        .in("status", ["sent", "delivered"])
        .limit(1)
        .maybeSingle();
      if (already) continue;

      const { error: invokeErr } = await supabase.functions.invoke("notify-rental-event", {
        body: { rental_id: r.id, event_key: "return_reminder_2h" },
      });
      if (invokeErr) {
        console.error("notify return_reminder_2h failed", r.id, invokeErr.message);
        continue;
      }
      sent += 1;
    }

    return new Response(
      JSON.stringify({ ok: true, hour, date, candidates: rentals?.length ?? 0, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-return-deadline-reminders error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}, "GET, POST, OPTIONS"));