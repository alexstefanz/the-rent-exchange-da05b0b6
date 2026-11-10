import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceCaller, unauthorizedResponse } from "../_shared/authGuard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Flat 48h first-response promise, with an early warning at 24h.
const SLA_RESPONSE_HOURS = 48;
const SLA_WARN_HOURS = 24;


const OPEN_STATUSES = ["NEW", "IN_PROGRESS", "WAITING_INTERNAL"];

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __caller = await requireServiceCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const result: Record<string, number> = { sla_alerts: 0, auto_closed: 0, reminders: 0 };

  try {
    const now = Date.now();

    // 1) 48h first-response SLA — warn at 24h, alert (and mark) on breach
    const { data: openTickets } = await admin
      .from("ops_tickets")
      .select(
        "id, public_id, title, priority, status, created_at, updated_at, last_admin_read_at, requester_user_id, first_response_at, sla_due_at, sla_breached_at",
      )
      .in("status", OPEN_STATUSES)
      .is("first_response_at", null);

    for (const t of openTickets || []) {
      const created = new Date(t.created_at).getTime();
      const dueAt = t.sla_due_at
        ? new Date(t.sla_due_at).getTime()
        : created + SLA_RESPONSE_HOURS * 3_600_000;
      const ageHrs = (now - created) / 3_600_000;
      const breached = now >= dueAt;
      const warn = !breached && ageHrs >= SLA_WARN_HOURS;
      if (!breached && !warn) continue;

      const entityType = breached ? "ops_ticket_sla" : "ops_ticket_sla_warning";

      if (breached && !t.sla_breached_at) {
        await admin
          .from("ops_tickets")
          .update({ sla_breached_at: new Date().toISOString() })
          .eq("id", t.id);
      }

      // Skip if a notification of this kind was already created for this ticket
      const { data: existing } = await admin
        .from("admin_notifications")
        .select("id")
        .eq("entity_type", entityType)
        .eq("entity_id", t.id)
        .maybeSingle();
      if (existing) continue;

      const hoursLeft = Math.max(0, Math.round((dueAt - now) / 3_600_000));
      await admin.from("admin_notifications").insert({
        type: breached ? "sla_breach" : "sla_warning",
        priority: breached ? "high" : "normal",
        entity_type: entityType,
        entity_id: t.id,
        link: `/admin/tickets/${t.id}`,
        title_ro: breached
          ? `SLA 48h depășit: ${t.public_id}`
          : `SLA 48h aproape de expirare: ${t.public_id}`,
        title_en: breached
          ? `48h SLA breached: ${t.public_id}`
          : `48h SLA due soon: ${t.public_id}`,
        description_ro: breached
          ? `${t.title} — fără răspuns de ${Math.round(ageHrs)}h.`
          : `${t.title} — mai sunt ~${hoursLeft}h până la termenul de răspuns.`,
        description_en: breached
          ? `${t.title} — no reply for ${Math.round(ageHrs)}h.`
          : `${t.title} — ~${hoursLeft}h left until the response deadline.`,
      });
      result.sla_alerts++;
    }


    // 2) Auto-close tickets in WAITING_CUSTOMER inactive >14 days
    const fourteenDaysAgo = new Date(now - 14 * 24 * 3_600_000).toISOString();
    const { data: stale } = await admin
      .from("ops_tickets")
      .select("id, public_id, requester_user_id")
      .eq("status", "WAITING_CUSTOMER")
      .lt("updated_at", fourteenDaysAgo);

    for (const t of stale || []) {
      await admin
        .from("ops_tickets")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("id", t.id);
      await admin.from("ops_ticket_audit_log").insert({
        ticket_id: t.id,
        action: "AUTO_CLOSED",
        new_value: "CLOSED",
        actor_id: null,
      });
      await admin.from("ops_ticket_messages").insert({
        ticket_id: t.id,
        author_type: "SYSTEM",
        message_text: "Ticket închis automat după 14 zile de inactivitate. Poți deschide unul nou oricând.",
        is_internal: false,
      });
      result.auto_closed++;
    }

    // 3) 48h customer reminder — WAITING_CUSTOMER tickets with no customer reply for 2 days
    const twoDaysAgo = new Date(now - 2 * 24 * 3_600_000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3_600_000).toISOString();
    const { data: pending } = await admin
      .from("ops_tickets")
      .select("id, public_id, title, requester_user_id, updated_at")
      .eq("status", "WAITING_CUSTOMER")
      .lt("updated_at", twoDaysAgo)
      .gt("updated_at", sevenDaysAgo);

    for (const t of pending || []) {
      // Skip if already reminded
      const { data: alreadyReminded } = await admin
        .from("ops_ticket_audit_log")
        .select("id")
        .eq("ticket_id", t.id)
        .eq("action", "REMINDER_SENT")
        .maybeSingle();
      if (alreadyReminded) continue;

      if (t.requester_user_id) {
        await admin.from("notifications").insert({
          user_id: t.requester_user_id,
          type: "ticket_reminder",
          title_ro: `Aștept răspunsul tău la ${t.public_id}`,
          title_en: `Awaiting your reply on ${t.public_id}`,
          description_ro: `Ticketul "${t.title}" se va închide automat dacă nu răspunzi în câteva zile.`,
          description_en: `Ticket "${t.title}" will auto-close soon if there's no reply.`,
          link: `/tickete?open=${t.id}`,
        });
      }
      await admin.from("ops_ticket_audit_log").insert({
        ticket_id: t.id,
        action: "REMINDER_SENT",
        actor_id: null,
      });
      result.reminders++;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ops-tickets-cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, "POST, OPTIONS"));