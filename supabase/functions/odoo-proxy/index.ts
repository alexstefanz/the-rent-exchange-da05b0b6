import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

  const result = await odooJsonRpc(`${ODOO_URL}/web/session/authenticate`, {
    db: ODOO_DB,
    login: ODOO_LOGIN,
    password: ODOO_PASSWORD,
  });

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
});
