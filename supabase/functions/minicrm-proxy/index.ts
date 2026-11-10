import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireCaller, callerHasRole, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const caller = await requireCaller(req);
    if (!caller) return unauthorizedResponse(corsHeaders);
    if (caller.kind === "user") {
      const isAdmin = await callerHasRole(caller.userId!, "admin");
      if (!isAdmin) return unauthorizedResponse(corsHeaders);
    }
    const SYSTEM_ID = Deno.env.get("MINICRM_SYSTEM_ID");
    const API_KEY = Deno.env.get("MINICRM_API_KEY");
    const BASE_URL = Deno.env.get("MINICRM_BASE_URL");

    if (!SYSTEM_ID || !API_KEY || !BASE_URL) {
      console.error("Missing MiniCRM secrets. Configured:", {
        hasSystemId: !!SYSTEM_ID,
        hasApiKey: !!API_KEY,
        hasBaseUrl: !!BASE_URL,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "MiniCRM credentials not configured. Please set MINICRM_SYSTEM_ID, MINICRM_API_KEY, and MINICRM_BASE_URL secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${SYSTEM_ID}:${API_KEY}`);
    const body = await req.json();
    const { action, data } = body;

    console.log(`[minicrm-proxy] Action: ${action}`);

    if (action === "test-connection") {
      // Simple GET to verify credentials work
      const url = `${BASE_URL}/Api/R3/Category`;
      console.log(`[minicrm-proxy] Testing connection: GET ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`[minicrm-proxy] Test connection response status: ${response.status}`);

      if (response.ok) {
        return new Response(
          JSON.stringify({ success: true, connected: true, status: response.status, data: responseData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          connected: false,
          status: response.status,
          error: response.status === 401 || response.status === 403
            ? "Unauthorized – check your SystemID and API Key"
            : `MiniCRM returned status ${response.status}`,
          data: responseData,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-contact") {
      if (!data?.FirstName || !data?.LastName || !data?.Email) {
        return new Response(
          JSON.stringify({ success: false, error: "FirstName, LastName, and Email are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = `${BASE_URL}/Api/R3/Contact`;
      console.log(`[minicrm-proxy] Creating contact: PUT ${url}`, {
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
        Phone: data.Phone || "(not provided)",
      });

      const contactPayload: Record<string, string> = {
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
      };
      if (data.Phone) {
        contactPayload.Phone = data.Phone;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactPayload),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`[minicrm-proxy] Create contact response status: ${response.status}`);

      if (response.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            created: true,
            contactId: responseData?.Id || responseData?.ContactId || null,
            status: response.status,
            data: responseData,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let errorMessage = `MiniCRM returned status ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        errorMessage = "Unauthorized – check your SystemID and API Key";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded – please wait and try again";
      } else if (response.status >= 500) {
        errorMessage = "MiniCRM server error – please try again later";
      }

      return new Response(
        JSON.stringify({
          success: false,
          created: false,
          status: response.status,
          error: errorMessage,
          data: responseData,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[minicrm-proxy] Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}, "GET, POST, OPTIONS"));
