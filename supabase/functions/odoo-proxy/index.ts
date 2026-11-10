import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { message: string; code: number; data?: { message?: string } };
}

async function odooJsonRpc(url: string, params: Record<string, unknown>, sessionCookie?: string): Promise<JsonRpcResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionCookie) headers["Cookie"] = sessionCookie;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "call", params }),
  });

  const cookies = res.headers.get("set-cookie");
  const data = await res.json() as JsonRpcResponse;

  // Attach cookie for caller
  if (cookies) (data as Record<string, unknown>)._cookie = cookies;

  return data;
}

async function authenticate(): Promise<{ uid: number; sessionCookie: string }> {
  const ODOO_URL = Deno.env.get("ODOO_URL")!;
  const ODOO_DB = Deno.env.get("ODOO_DB")!;
  const ODOO_LOGIN = Deno.env.get("ODOO_LOGIN")!;
  const ODOO_PASSWORD = Deno.env.get("ODOO_PASSWORD")!;

  console.log(`[odoo-proxy] Authenticating to: ${ODOO_URL}/web/session/authenticate`);
  console.log(`[odoo-proxy] DB: "${ODOO_DB}", Login: "${ODOO_LOGIN}", Password length: ${ODOO_PASSWORD.length}`);

  const result = await odooJsonRpc(`${ODOO_URL}/web/session/authenticate`, {
    db: ODOO_DB,
    login: ODOO_LOGIN,
    password: ODOO_PASSWORD,
  });

  console.log(`[odoo-proxy] Auth response uid:`, (result.result as Record<string, unknown>)?.uid);
  if (result.error) console.error(`[odoo-proxy] Auth error:`, JSON.stringify(result.error));

  if (result.error) {
    throw new Error(result.error.data?.message || result.error.message || "Authentication failed");
  }

  const uid = (result.result as Record<string, unknown>)?.uid;
  if (!uid || uid === false) {
    throw new Error("Authentication failed — invalid credentials or API key");
  }

  const cookie = (result as Record<string, unknown>)._cookie as string || "";

  return { uid: uid as number, sessionCookie: cookie };
}

async function callKw(
  sessionCookie: string,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<unknown> {
  const ODOO_URL = Deno.env.get("ODOO_URL")!;

  const result = await odooJsonRpc(`${ODOO_URL}/web/dataset/call_kw`, {
    model,
    method,
    args,
    kwargs: { ...kwargs, context: {} },
  }, sessionCookie);

  if (result.error) {
    throw new Error(result.error.data?.message || result.error.message || `${model}.${method} failed`);
  }

  return result.result;
}

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH: require authenticated admin caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden — admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ODOO_URL = Deno.env.get("ODOO_URL");
    const ODOO_DB = Deno.env.get("ODOO_DB");
    const ODOO_LOGIN = Deno.env.get("ODOO_LOGIN");
    const ODOO_PASSWORD = Deno.env.get("ODOO_PASSWORD");

    if (!ODOO_URL || !ODOO_DB || !ODOO_LOGIN || !ODOO_PASSWORD) {
      console.error("[odoo-proxy] Missing secrets:", {
        hasUrl: !!ODOO_URL, hasDb: !!ODOO_DB, hasLogin: !!ODOO_LOGIN, hasPassword: !!ODOO_PASSWORD,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Odoo credentials not configured. Set ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_PASSWORD." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, data } = body;
    console.log(`[odoo-proxy] Action: ${action}`);

    // --- TEST CONNECTION ---
    if (action === "test-connection") {
      try {
        const { uid } = await authenticate();
        return new Response(
          JSON.stringify({ success: true, connected: true, uid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, connected: false, error: err.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- LIST LEADS ---
    if (action === "list-leads") {
      const { uid, sessionCookie } = await authenticate();
      const leads = await callKw(sessionCookie, "crm.lead", "search_read", [
        [], // domain (empty = all)
        ["name", "contact_name", "email_from", "phone", "stage_id", "expected_revenue", "create_date"],
      ], { limit: data?.limit || 20 });

      return new Response(
        JSON.stringify({ success: true, uid, leads }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CREATE LEAD ---
    if (action === "create-lead") {
      if (!data?.name) {
        return new Response(
          JSON.stringify({ success: false, error: "Lead name is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { uid, sessionCookie } = await authenticate();

      const leadData: Record<string, unknown> = { name: data.name, type: "lead" };
      if (data.contact_name) leadData.contact_name = data.contact_name;
      if (data.email_from) leadData.email_from = data.email_from;
      if (data.phone) leadData.phone = data.phone;
      if (data.expected_revenue) leadData.expected_revenue = Number(data.expected_revenue);

      const leadId = await callKw(sessionCookie, "crm.lead", "create", [[leadData]]);

      // Send email notification to office@rentli.ro
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const rows = [
            data.name ? `<tr><td style="padding:6px 12px;color:#6B6155;">Nume lead</td><td style="padding:6px 12px;color:#2D2517;font-weight:600;">${data.name}</td></tr>` : '',
            data.contact_name ? `<tr><td style="padding:6px 12px;color:#6B6155;">Contact</td><td style="padding:6px 12px;color:#2D2517;font-weight:600;">${data.contact_name}</td></tr>` : '',
            data.email_from ? `<tr><td style="padding:6px 12px;color:#6B6155;">Email</td><td style="padding:6px 12px;color:#2D2517;font-weight:600;">${data.email_from}</td></tr>` : '',
            data.phone ? `<tr><td style="padding:6px 12px;color:#6B6155;">Telefon</td><td style="padding:6px 12px;color:#2D2517;font-weight:600;">${data.phone}</td></tr>` : '',
            data.expected_revenue ? `<tr><td style="padding:6px 12px;color:#6B6155;">Venit estimat</td><td style="padding:6px 12px;color:#2D2517;font-weight:600;">${data.expected_revenue} RON</td></tr>` : '',
          ].filter(Boolean).join('');

          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F7;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:520px;">
  <tr><td style="background:#F59E0B;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
    <span style="color:#fff;font-size:24px;font-weight:700;">Rentli</span>
  </td></tr>
  <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 8px;color:#2D2517;font-size:20px;">🎉 Lead nou creat în Odoo</h2>
    <p style="margin:0 0 24px;color:#6B6155;font-size:15px;">Un nou lead a fost creat automat din platforma Rentli.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DF;border-bottom:1px solid #E8E4DF;margin-bottom:24px;padding:8px 0;">${rows}</table>
    <p style="margin:0;color:#9B9489;font-size:12px;">Lead ID în Odoo: ${leadId}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: "Rentli <noreply@rentli.ro>",
              to: ["office@rentli.ro"],
              subject: `Nou lead Rentli: ${data.name}`,
              html,
            }),
          });
          console.log("[odoo-proxy] Email notification sent to office@rentli.ro");
        } catch (emailErr) {
          console.error("[odoo-proxy] Email notification failed:", emailErr.message);
        }
      }

      return new Response(
        JSON.stringify({ success: true, uid, leadId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[odoo-proxy] Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}, "POST, OPTIONS"));
