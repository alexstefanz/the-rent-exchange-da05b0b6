// Shared caller-auth helper for internal edge functions.
// Accepts either the platform service-role key (edge-to-edge / cron / DB triggers)
// or a valid end-user JWT (Supabase auth). Blocks anonymous public callers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type CallerKind = "service" | "user";
export interface Caller {
  kind: CallerKind;
  userId?: string;
  email?: string;
}

/**
 * Verify the request bearer token is either the service role key or a valid
 * end-user JWT. Returns a {@link Caller}. On failure, returns null — the caller
 * should short-circuit with a 401 response.
 */
export async function requireCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  // Fall back to the `apikey` header: some supabase-js versions send the key
  // there only, which would otherwise look like an anonymous call.
  const apikeyHeader = req.headers.get("apikey") || req.headers.get("Apikey");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.replace(/^Bearer\s+/i, "").trim()
    : (apikeyHeader || "").trim();
  if (!token) return null;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (serviceKey && token === serviceKey) {
    return { kind: "service" };
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  // Reject bare anon-key calls — they are public and not proof of identity.
  if (anonKey && token === anonKey) return null;

  try {
    const client = createClient(url, anonKey);
    const { data, error } = await client.auth.getUser(token);
    if (!error && data?.user) {
      return { kind: "user", userId: data.user.id, email: data.user.email ?? undefined };
    }
  } catch {
    // fall through to service-key verification below
  }

  // Not a user token. It may still be a service/secret key whose value differs
  // from the SUPABASE_SERVICE_ROLE_KEY visible to this function (legacy JWT vs
  // new `sb_secret_*` format). Verify it against an admin-only endpoint.
  try {
    const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { kind: "service" };
  } catch {
    return null;
  }

  return null;
}


/** Returns true if the given user has the given role in `user_roles`. */
export async function callerHasRole(userId: string, role: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  return !!data;
}

export function unauthorizedResponse(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}