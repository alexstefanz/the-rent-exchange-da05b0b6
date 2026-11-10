import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://rentli.ro";

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function redirect(to: string) {
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: to },
  });
}

Deno.serve(withCors(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    if (!token || token.length > 256) {
      return redirect(`${APP_URL}/?invalid_link=1`);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("secure_action_tokens")
      .select("token, redirect_path, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("[resolve-action-token] DB error:", error);
      return redirect(`${APP_URL}/?invalid_link=1`);
    }
    if (!row) {
      console.log(`[resolve-action-token] Token not found: ${token.slice(0, 8)}...`);
      return redirect(`${APP_URL}/?invalid_link=1`);
    }

    const now = Date.now();
    if (row.expires_at && new Date(row.expires_at).getTime() < now) {
      console.log("[resolve-action-token] Token expired");
      return redirect(`${APP_URL}/?expired_link=1`);
    }

    // Mark as used on first hit (idempotent for repeat clicks within validity window)
    if (!row.used_at) {
      await supabase
        .from("secure_action_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);
    }

    const path = row.redirect_path && row.redirect_path.startsWith("/")
      ? row.redirect_path
      : "/";
    return redirect(`${APP_URL}${path}`);
  } catch (e) {
    console.error("[resolve-action-token] Unhandled error:", e);
    return redirect(`${APP_URL}/?invalid_link=1`);
  }
}, "GET, POST, OPTIONS"));