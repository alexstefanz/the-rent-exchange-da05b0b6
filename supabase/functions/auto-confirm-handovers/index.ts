import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Cron must present the service-role key as Bearer to invoke this function.
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data, error } = await admin.rpc("auto_confirm_overdue_handovers");
  if (error) {
    console.error("auto_confirm_overdue_handovers RPC error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rentalIds: string[] = (data ?? []).map((r: any) => r.rental_id ?? r);
  console.log(`auto-confirm-handovers: updated ${rentalIds.length} rental(s)`);

  // Fire-and-log notifications for each auto-confirmed rental.
  await Promise.all(
    rentalIds.map(async (id) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-rental-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            event: "handover_confirmed",
            rentalId: id,
            extra: { autoConfirmed: true, reason: "auto_handover_24h" },
          }),
        });
        if (!res.ok) {
          console.error(`notify-rental-event failed for ${id}:`, await res.text());
        }
      } catch (e) {
        console.error(`notify-rental-event threw for ${id}:`, e);
      }
    })
  );

  return new Response(JSON.stringify({ updated: rentalIds.length, rentalIds }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}, "POST, OPTIONS"));