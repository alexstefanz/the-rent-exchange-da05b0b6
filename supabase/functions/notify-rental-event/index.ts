import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireCaller, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://rentli.ro";

type Channel = "in_app" | "email" | "sms";
type Recipient = "owner" | "renter" | "both";

// Owner email policy: owners receive ONLY these 3 emails per rental lifecycle.
// All other events still send in-app + SMS to the owner (where configured).
const OWNER_EMAIL_ALLOWED = new Set<string>([
  "request_created",
  "handover_confirmed",
  "rental_completed",
]);

type EventKey =
  | "request_created"
  | "request_accepted"
  | "request_rejected"
  | "pickup_scheduled"
  | "pv_pickup_pending"
  | "pv_pickup_completed_by_party"
  | "handover_confirmed"
  | "active_rental_started"
  | "return_reminder_24h"
  | "return_reminder_2h"
  | "return_in_progress"
  | "pv_return_pending"
  | "pv_return_completed_by_party"
  | "rental_completed"
  | "review_reminder"
  | "dispute_opened"
  | "cancel_request_submitted"
  | "cancel_request_withdrawn"
  | "cancel_request_approved"
  | "cancel_request_rejected"
  | "cancellation_confirmed"
  | "mutual_cancel_approved"
  | "payment_succeeded"
  | "request_cancelled_by_renter"
  | "request_cancelled_by_owner"
  | "request_reminder_2h"
  | "request_expired";

interface EventConfig {
  recipients: Recipient;
  channels: Channel[];
  critical: boolean;
  emailTemplate?: { renter?: string; owner?: string; both?: string };
  smsTemplate?: { renter?: string; owner?: string; both?: string };
  inAppTitle: { ro: string; en: string } | ((ctx: Ctx) => { ro: string; en: string });
  inAppDesc: (ctx: Ctx) => { ro: string; en: string };
  link: (ctx: Ctx) => string;
  smsPurpose?: string;
}

interface Ctx {
  rental: any;
  product: any;
  owner: any;
  renter: any;
  extra: Record<string, any>;
  recipientRole: "owner" | "renter";
}

const EVENTS: Record<EventKey, EventConfig> = {
  request_created: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: false,
    emailTemplate: { owner: "rental-request-owner", renter: "rental-request-renter" },
    // SMS only to the recipient of the action (owner gets the new request).
    smsTemplate: { owner: "rental_request_owner" },
    inAppTitle: { ro: "Cerere nouă de închiriere", en: "New rental request" },
    inAppDesc: (c) => ({ ro: `Cerere pentru "${c.product?.title}"`, en: `Request for "${c.product?.title}"` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  request_accepted: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: false,
    emailTemplate: { owner: "rental-accepted-owner", renter: "rental-accepted-renter" },
    // SMS only to the recipient of the action (renter learns request was accepted).
    smsTemplate: { renter: "rental_accepted" },
    inAppTitle: { ro: "Cererea a fost acceptată", en: "Request accepted" },
    inAppDesc: (c) => ({ ro: `Cererea pentru "${c.product?.title}" a fost acceptată`, en: `Request for "${c.product?.title}" was accepted` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  payment_succeeded: {
    recipients: "both", channels: ["in_app"], critical: true,
    smsTemplate: { owner: "rental_accepted_owner", renter: "rental_accepted" },
    inAppTitle: { ro: "Plata a fost confirmată", en: "Payment confirmed" },
    inAppDesc: (c) => ({ ro: `Plata pentru "${c.product?.title}" a fost confirmată`, en: `Payment for "${c.product?.title}" was confirmed` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  request_rejected: {
    recipients: "both", channels: ["in_app", "email"], critical: false,
    emailTemplate: { renter: "rental-rejected" },
    inAppTitle: (c) => c.recipientRole === "owner"
      ? { ro: "Ai refuzat cererea", en: "You declined the request" }
      : { ro: "Cererea a fost refuzată", en: "Request declined" },
    inAppDesc: (c) => c.recipientRole === "owner"
      ? { ro: `Ai refuzat cererea pentru "${c.product?.title}"`, en: `You declined the request for "${c.product?.title}"` }
      : { ro: `Cererea pentru "${c.product?.title}" a fost refuzată`, en: `Request for "${c.product?.title}" was declined` },
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  pickup_scheduled: {
    recipients: "both", channels: ["in_app", "email"], critical: true,
    emailTemplate: { both: "pickup-scheduled" },
    inAppTitle: { ro: "Predarea a fost stabilită", en: "Pickup scheduled" },
    inAppDesc: (c) => ({ ro: `Predarea pentru "${c.product?.title}" e confirmată`, en: `Pickup for "${c.product?.title}" confirmed` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  pv_pickup_pending: {
    recipients: "both", channels: ["in_app", "email"], critical: true,
    emailTemplate: { both: "pv-pending" },
    inAppTitle: { ro: "Completează procesul verbal de predare", en: "Complete pickup inspection" },
    inAppDesc: (c) => ({ ro: `PV-ul de predare pentru "${c.product?.title}" e obligatoriu`, en: `Pickup inspection for "${c.product?.title}" is mandatory` }),
    link: (c) => `/rezervari/${c.rental.public_id}?pv=handover`,
  },
  pv_pickup_completed_by_party: {
    recipients: "both", channels: ["in_app", "email"], critical: true,
    emailTemplate: { both: "pv-other-done" },
    inAppTitle: { ro: "PV de predare completat parțial", en: "Pickup PV partially complete" },
    inAppDesc: (c) => ({ ro: `${c.extra.actorName ?? "Cealaltă parte"} a completat PV-ul. Verifică-l.`, en: `${c.extra.actorName ?? "The other party"} completed the PV. Review it.` }),
    link: (c) => `/rezervari/${c.rental.public_id}?pv=handover`,
  },
  handover_confirmed: {
    recipients: "both", channels: ["in_app", "email"], critical: false,
    emailTemplate: { both: "handover-confirmed" },
    inAppTitle: { ro: "Predarea a fost confirmată", en: "Handover confirmed" },
    inAppDesc: (c) => ({ ro: `Închirierea "${c.product?.title}" e activă`, en: `Rental "${c.product?.title}" is active` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  active_rental_started: {
    recipients: "both", channels: ["in_app"], critical: false,
    inAppTitle: { ro: "Închiriere activă", en: "Rental active" },
    inAppDesc: (c) => ({ ro: `Folosește produsul "${c.product?.title}" până pe ${c.rental.end_date}`, en: `Use "${c.product?.title}" until ${c.rental.end_date}` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  return_reminder_24h: {
    recipients: "both", channels: ["in_app", "email"], critical: false,
    emailTemplate: { both: "return-reminder" },
    inAppTitle: { ro: "Reminder returnare", en: "Return reminder" },
    inAppDesc: (c) => ({ ro: `Returnarea pentru "${c.product?.title}" se apropie`, en: `Return for "${c.product?.title}" approaching` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  return_reminder_2h: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { both: "return-deadline-2h" },
    smsTemplate: { owner: "return_deadline_2h_owner", renter: "return_deadline_2h" },
    inAppTitle: { ro: "⏰ Mai sunt 2 ore până la deadline", en: "⏰ 2 hours left until deadline" },
    inAppDesc: (c) => ({ ro: `Returnează "${c.product?.title}" până la miezul nopții pentru a evita penalizările.`, en: `Return "${c.product?.title}" before midnight to avoid penalties.` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  return_in_progress: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { both: "return-in-progress" },
    smsTemplate: { both: "return_in_progress" },
    inAppTitle: { ro: "Returnare în curs", en: "Return in progress" },
    inAppDesc: (c) => ({ ro: `Completează PV-ul de returnare pentru "${c.product?.title}"`, en: `Complete return PV for "${c.product?.title}"` }),
    link: (c) => `/rezervari/${c.rental.public_id}?pv=return`,
    smsPurpose: "pv_return",
  },
  pv_return_pending: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { both: "pv-pending" },
    smsTemplate: { both: "pv_pending" },
    inAppTitle: { ro: "PV de returnare necesar", en: "Return PV required" },
    inAppDesc: (c) => ({ ro: `Completează PV-ul de returnare pentru "${c.product?.title}"`, en: `Complete return PV for "${c.product?.title}"` }),
    link: (c) => `/rezervari/${c.rental.public_id}?pv=return`,
    smsPurpose: "pv_return",
  },
  pv_return_completed_by_party: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { both: "pv-other-done" },
    smsTemplate: { both: "pv_other_done" },
    inAppTitle: { ro: "PV de returnare completat parțial", en: "Return PV partially complete" },
    inAppDesc: (c) => ({ ro: `${c.extra.actorName ?? "Cealaltă parte"} a completat PV-ul de returnare`, en: `${c.extra.actorName ?? "The other party"} completed the return PV` }),
    link: (c) => `/rezervari/${c.rental.public_id}?pv=return`,
    smsPurpose: "pv_return",
  },
  rental_completed: {
    recipients: "both", channels: ["in_app", "email"], critical: false,
    emailTemplate: { owner: "rental-completed-owner", renter: "rental-completed-renter" },
    inAppTitle: { ro: "Închiriere finalizată", en: "Rental completed" },
    inAppDesc: (c) => ({ ro: `Închirierea pentru "${c.product?.title}" a fost finalizată`, en: `Rental for "${c.product?.title}" is complete` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  review_reminder: {
    recipients: "both", channels: ["in_app", "email"], critical: false,
    emailTemplate: { both: "review-reminder" },
    smsTemplate: { both: "review_reminder" },
    inAppTitle: { ro: "Lasă un review", en: "Leave a review" },
    inAppDesc: (c) => ({ ro: `Lasă un review pentru "${c.product?.title}"`, en: `Leave a review for "${c.product?.title}"` }),
    link: (c) => `/rezervari/${c.rental.public_id}?review=1`,
  },
  dispute_opened: {
    recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { both: "dispute-opened" },
    smsTemplate: { both: "dispute_opened" },
    inAppTitle: { ro: "Dispută deschisă", en: "Dispute opened" },
    inAppDesc: (c) => ({ ro: `O dispută a fost deschisă pe "${c.product?.title}"`, en: `A dispute was opened on "${c.product?.title}"` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
  cancel_request_submitted: {
    recipients: "both", channels: ["in_app"], critical: false,
    inAppTitle: { ro: "Cerere de anulare trimisă", en: "Cancellation request submitted" },
    inAppDesc: (c) => ({ ro: `Cererea de anulare pentru "${c.product?.title}" este în revizuire`, en: `Cancellation request for "${c.product?.title}" is under review` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  cancel_request_withdrawn: {
    recipients: "both", channels: ["in_app"], critical: false,
    inAppTitle: { ro: "Cerere de anulare retrasă", en: "Cancellation request withdrawn" },
    inAppDesc: (c) => ({ ro: `Cererea de anulare pentru "${c.product?.title}" a fost retrasă`, en: `Cancellation request for "${c.product?.title}" was withdrawn` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  cancel_request_approved: {
    recipients: "both", channels: ["in_app"], critical: true,
    inAppTitle: { ro: "Anulare aprobată", en: "Cancellation approved" },
    inAppDesc: (c) => ({ ro: `Anularea pentru "${c.product?.title}" a fost aprobată`, en: `Cancellation for "${c.product?.title}" was approved` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  cancel_request_rejected: {
    recipients: "both", channels: ["in_app"], critical: false,
    inAppTitle: { ro: "Cerere de anulare respinsă", en: "Cancellation request rejected" },
    inAppDesc: (c) => ({ ro: `Cererea de anulare pentru "${c.product?.title}" a fost respinsă`, en: `Cancellation request for "${c.product?.title}" was rejected` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  cancellation_confirmed: {
    recipients: "both", channels: ["in_app"], critical: true,
    inAppTitle: { ro: "Rezervare anulată", en: "Reservation cancelled" },
    inAppDesc: (c) => ({ ro: `Rezervarea pentru "${c.product?.title}" a fost anulată`, en: `Reservation for "${c.product?.title}" was cancelled` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  mutual_cancel_approved: {
    recipients: "both", channels: ["in_app"], critical: true,
    inAppTitle: { ro: "Anulare confirmată", en: "Cancellation confirmed" },
    inAppDesc: (c) => ({ ro: `Anularea pentru "${c.product?.title}" a fost confirmată`, en: `Cancellation for "${c.product?.title}" was confirmed` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
  },
  request_cancelled_by_renter: {
    recipients: "owner", channels: ["in_app", "email", "sms"], critical: true,
    emailTemplate: { owner: "cancellation-owner" },
    smsTemplate: { owner: "rental_cancelled_owner" },
    inAppTitle: { ro: "Cerere de închiriere anulată", en: "Rental request cancelled" },
    inAppDesc: (c) => ({ ro: `Chiriașul a anulat cererea pentru "${c.product?.title}" înainte de plată`, en: `The renter cancelled the request for "${c.product?.title}" before payment` }),
    link: (c) => `/rezervari/${c.rental.public_id}`,
    smsPurpose: "view_rental",
  },
};

EVENTS.request_cancelled_by_owner = {
  recipients: "renter", channels: ["in_app", "email", "sms"], critical: true,
  emailTemplate: { renter: "cancellation-renter" },
  smsTemplate: { renter: "rental_cancelled" },
  inAppTitle: { ro: "Rezervare anulată de proprietar", en: "Reservation cancelled by owner" },
  inAppDesc: (c) => ({ ro: `Proprietarul a anulat rezervarea pentru "${c.product?.title}" înainte de plată`, en: `The owner cancelled the reservation for "${c.product?.title}" before payment` }),
  link: (c) => `/rezervari/${c.rental.public_id}`,
  smsPurpose: "view_rental",
};

EVENTS.request_reminder_2h = {
  recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
  emailTemplate: { owner: "request-reminder-2h-owner", renter: "request-reminder-2h-renter" },
  smsTemplate: { owner: "request_reminder_2h_owner", renter: "request_reminder_2h_renter" },
  inAppTitle: (c) => c.recipientRole === "owner"
    ? { ro: "⏰ Mai ai 2 ore să răspunzi la cerere", en: "⏰ 2 hours left to respond" }
    : { ro: "Cererea ta așteaptă răspuns", en: "Your request awaits a response" },
  inAppDesc: (c) => c.recipientRole === "owner"
    ? { ro: `Răspunde la cererea pentru "${c.product?.title}" sau va fi anulată automat.`, en: `Respond to the request for "${c.product?.title}" or it will auto-cancel.` }
    : { ro: `Așteptăm răspunsul proprietarului pentru "${c.product?.title}". Mai are 2 ore.`, en: `Awaiting owner response for "${c.product?.title}". 2 hours left.` },
  link: (c) => `/rezervari/${c.rental.public_id ?? ""}`,
  smsPurpose: "view_rental",
};

EVENTS.request_expired = {
  recipients: "both", channels: ["in_app", "email", "sms"], critical: true,
  emailTemplate: { owner: "request-expired-owner", renter: "request-expired-renter" },
  smsTemplate: { owner: "request_expired_owner", renter: "request_expired_renter" },
  inAppTitle: { ro: "Cerere expirată automat", en: "Request auto-expired" },
  inAppDesc: (c) => c.recipientRole === "renter"
    ? { ro: `Cererea pentru "${c.product?.title}" a expirat (fără răspuns în 48h). Hold-ul a fost eliberat integral.`, en: `Request for "${c.product?.title}" expired (no response in 48h). Hold fully released.` }
    : { ro: `Cererea pentru "${c.product?.title}" a expirat fără răspuns și a fost anulată automat.`, en: `Request for "${c.product?.title}" expired without response and was auto-cancelled.` },
  link: (c) => `/rezervari/${c.rental.public_id ?? ""}`,
  smsPurpose: "view_rental",
};

function genToken(): string {
  // 12-char URL-safe token
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);


  try {
    const { rental_id, event_key, actor_id, extra } = await req.json() as {
      rental_id: string; event_key: EventKey; actor_id?: string; extra?: Record<string, any>;
    };

    const cfg = EVENTS[event_key];
    if (!cfg) return new Response(JSON.stringify({ error: "Unknown event_key" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!rental_id) return new Response(JSON.stringify({ error: "rental_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: rental } = await supabase.from("rentals").select("*").eq("id", rental_id).single();
    if (!rental) return new Response(JSON.stringify({ error: "Rental not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [productRes, ownerRes, renterRes] = await Promise.all([
      supabase.from("products").select("title, slug, images").eq("id", rental.product_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, email, phone").eq("id", rental.owner_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, email, phone").eq("id", rental.renter_id).maybeSingle(),
    ]);
    const product = productRes.data;
    const owner = ownerRes.data;
    const renter = renterRes.data;

    const recipients: ("owner" | "renter")[] =
      cfg.recipients === "both" ? ["owner", "renter"] :
      cfg.recipients === "owner" ? ["owner"] : ["renter"];

    const results: any[] = [];

    // ── PV PDF generation (cached for the duration of this request) ──────
    // Some events should ship the proces-verbal PDF as a link (and optionally
    // an attachment). Generate once and reuse for both recipients.
    const pvPhase: "handover" | "return" | null =
      (event_key === "handover_confirmed" || event_key === "pv_pickup_completed_by_party") ? "handover" :
      (event_key === "rental_completed" || event_key === "pv_return_completed_by_party") ? "return" : null;
    const attachPv = event_key === "handover_confirmed" || event_key === "rental_completed";
    let pvAsset: { signed_url: string; filename: string; base64: string } | null = null;
    if (pvPhase) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-pv-pdf", {
          body: { rental_id, phase: pvPhase },
        });
        if (error) console.error("[notify-rental-event] PV gen error:", error);
        else if (data?.signed_url) pvAsset = { signed_url: data.signed_url, filename: data.filename, base64: data.base64 };
      } catch (e) {
        console.error("[notify-rental-event] PV gen threw:", e);
      }
    }

    for (const role of recipients) {
      // Skip notifying the actor for "_completed_by_party" events (they did the action)
      const userObj = role === "owner" ? owner : renter;
      if (!userObj) continue;
      if (actor_id && userObj.id === actor_id && (event_key === "pv_pickup_completed_by_party" || event_key === "pv_return_completed_by_party")) {
        continue;
      }

      const ctx: Ctx = { rental, product, owner, renter, extra: extra || {}, recipientRole: role };
      const desc = cfg.inAppDesc(ctx);
      const title = typeof cfg.inAppTitle === "function" ? cfg.inAppTitle(ctx) : cfg.inAppTitle;
      const linkPath = cfg.link(ctx);

      // Load preferences
      const { data: prefs } = await supabase.from("notification_preferences").select("*").eq("user_id", userObj.id).maybeSingle();
      const emailAllowed = cfg.critical || prefs?.email_transactional !== false;
      const smsAllowed = cfg.critical || prefs?.sms_transactional !== false;

      // Helper to check + log idempotency
      const alreadySent = async (channel: Channel): Promise<boolean> => {
        const { data } = await supabase.from("notification_audit_log")
          .select("id").eq("rental_id", rental_id).eq("event_key", event_key)
          .eq("user_id", userObj.id).eq("channel", channel).in("status", ["sent","delivered"])
          .limit(1).maybeSingle();
        return !!data;
      };

      // 1) IN-APP
      if (cfg.channels.includes("in_app") && !(await alreadySent("in_app"))) {
        await supabase.from("notifications").insert({
          user_id: userObj.id,
          type: event_key,
          title_ro: title.ro,
          title_en: title.en,
          description_ro: desc.ro,
          description_en: desc.en,
          link: linkPath,
        });
        await supabase.from("notification_audit_log").insert({
          rental_id, user_id: userObj.id, event_key, channel: "in_app", status: "sent",
        });
        results.push({ role, channel: "in_app", status: "sent" });
      }

      // 2) EMAIL
      if (cfg.channels.includes("email") && cfg.emailTemplate && userObj.email) {
        if (role === "owner" && !OWNER_EMAIL_ALLOWED.has(event_key)) {
          await supabase.from("notification_audit_log").insert({
            rental_id, user_id: userObj.id, event_key, channel: "email",
            status: "skipped", error: "owner_email_filtered",
          });
        } else if (!emailAllowed) {
          await supabase.from("notification_audit_log").insert({ rental_id, user_id: userObj.id, event_key, channel: "email", status: "skipped", error: "opt_out" });
        } else if (!(await alreadySent("email"))) {
          const tplName = cfg.emailTemplate[role] || cfg.emailTemplate.both;
          if (tplName) {
            const otherUser = role === "owner" ? renter : owner;
            const templateData: Record<string, any> = {
              productTitle: product?.title,
              productImage: Array.isArray(product?.images) ? product.images[0] : undefined,
              startDate: rental.start_date,
              endDate: rental.end_date,
              rentalDays: rental.rental_days,
              currency: "RON",
              rentalId: rental.id,
              ownerName: owner?.full_name,
              renterName: renter?.full_name,
              otherPartyName: otherUser?.full_name,
              ownerPayout: rental.owner_payout,
              totalPaid: rental.subtotal,
              pickupDate: rental.pickup_time ? new Date(rental.pickup_time).toLocaleDateString("ro-RO") : extra?.pickupDate,
              pickupTime: rental.pickup_time ? new Date(rental.pickup_time).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) : extra?.pickupTime,
              pickupLocation: rental.pickup_location || extra?.pickupLocation,
              contactName: otherUser?.full_name,
              phase: event_key.includes("return") ? "return" : "pickup",
              reason: extra?.reason,
              reporterName: extra?.actorName,
              pvPdfUrl: pvAsset?.signed_url,
            };
            try {
              // Thread context: group all emails for this rental into a single
              // Gmail/Outlook conversation (Message-ID/In-Reply-To/References).
              const rentalCode = rental.public_id || `id-${rental.id.slice(0, 8)}`;
              const threadKey = `rental:${rentalCode}`;
              const subjectSuffix = product?.title || rentalCode;
              const { error: emErr } = await supabase.functions.invoke("send-transactional-email", {
                body: {
                  templateName: tplName,
                  recipientEmail: userObj.email,
                  idempotencyKey: `${event_key}:${rental_id}:${userObj.id}`,
                  templateData,
                  threadKey,
                  subjectSuffix,
                  ...(attachPv && pvAsset ? {
                    attachments: [{ filename: pvAsset.filename, content: pvAsset.base64 }],
                  } : {}),
                },
              });
              await supabase.from("notification_audit_log").insert({
                rental_id, user_id: userObj.id, event_key, channel: "email",
                status: emErr ? "failed" : "sent",
                error: emErr ? String(emErr.message || emErr) : null,
                payload: { template: tplName },
              });
              results.push({ role, channel: "email", template: tplName, status: emErr ? "failed" : "sent" });
            } catch (e) {
              await supabase.from("notification_audit_log").insert({
                rental_id, user_id: userObj.id, event_key, channel: "email", status: "failed",
                error: String((e as Error).message),
              });
            }
          }
        }
      }

      // 3) SMS
      const smsTpl = cfg.smsTemplate ? (cfg.smsTemplate[role] || cfg.smsTemplate.both) : undefined;
      if (cfg.channels.includes("sms") && smsTpl) {
        if (!smsAllowed) {
          await supabase.from("notification_audit_log").insert({ rental_id, user_id: userObj.id, event_key, channel: "sms", status: "skipped", error: "opt_out" });
        } else if (!(await alreadySent("sms"))) {
          // Generate secure token + short link if needed
          let smsLink = `${APP_URL}${linkPath}`;
          if (cfg.smsPurpose) {
            const token = genToken();
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
            await supabase.from("secure_action_tokens").insert({
              token, rental_id, user_id: userObj.id, purpose: cfg.smsPurpose,
              redirect_path: linkPath, expires_at: expiresAt,
            });
            smsLink = `${APP_URL}/a/${token}`;
          }
          const otherUser = role === "owner" ? renter : owner;
          try {
            // Direct fetch (not functions.invoke): guarantees the service-role
            // Authorization header reaches send-sms-notification's requireCaller
            // guard, independent of supabase-js client version behaviour.
            const smsRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
                },
                body: JSON.stringify({
                  templateKey: smsTpl,
                  userId: userObj.id,
                  rentalId: rental.id,
                  idempotencyKey: `${event_key}:${rental_id}:${userObj.id}`,
                  variables: {
                    productTitle: product?.title,
                    ownerName: owner?.full_name,
                    renterName: renter?.full_name,
                    otherPartyName: otherUser?.full_name,
                    link: smsLink,
                    pickupDate: rental.pickup_time ? new Date(rental.pickup_time).toLocaleDateString("ro-RO") : undefined,
                    pickupLocation: rental.pickup_location || undefined,
                  },
                }),
              },
            );
            const smsBody = await smsRes.text();
            const smsOk = smsRes.ok;
            if (!smsOk) {
              console.error(`[notify-rental-event] SMS failed status=${smsRes.status} body=${smsBody.slice(0, 300)}`);
            }
            await supabase.from("notification_audit_log").insert({
              rental_id, user_id: userObj.id, event_key, channel: "sms",
              status: smsOk ? "sent" : "failed",
              error: smsOk ? null : `HTTP ${smsRes.status}: ${smsBody.slice(0, 300)}`,
            });
            results.push({ role, channel: "sms", status: smsOk ? "sent" : "failed" });
          } catch (e) {
            await supabase.from("notification_audit_log").insert({
              rental_id, user_id: userObj.id, event_key, channel: "sms", status: "failed",
              error: String((e as Error).message),
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-rental-event] error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});