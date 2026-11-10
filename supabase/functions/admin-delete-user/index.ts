import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId: string | undefined = body?.user_id
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (targetUserId === userData.user.id) {
      return new Response(JSON.stringify({ error: 'Nu poți șterge propriul cont' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Best-effort cleanup of related rows (avoids FK violations on auth.users delete)
    const tables = [
      'user_roles',
      'admin_specializations',
      'favorite_users',
      'favorite_products',
      'notifications',
      'user_activity_logs',
      'product_drafts',
      'product_reviews',
      'conversations',
      'messages',
      'withdrawal_requests',
      'rentals',
      'products',
      'profiles',
    ]
    const cleanup: Record<string, string | null> = {}
    for (const t of tables) {
      const col = t === 'profiles' ? 'id'
        : t === 'products' ? 'owner_id'
        : t === 'rentals' ? 'renter_id'
        : t === 'conversations' ? 'buyer_id'
        : 'user_id'
      try {
        const { error } = await admin.from(t).delete().eq(col, targetUserId)
        cleanup[t] = error ? error.message : 'ok'
      } catch (e) {
        cleanup[t] = (e as Error).message
      }
      // For tables with multiple FK roles, also attempt secondary
      if (t === 'rentals') {
        await admin.from('rentals').delete().eq('owner_id', targetUserId).then(({ error }) => {
          if (error) cleanup['rentals_owner'] = error.message
        })
      }
      if (t === 'conversations') {
        await admin.from('conversations').delete().eq('owner_id', targetUserId).then(({ error }) => {
          if (error) cleanup['conversations_owner'] = error.message
        })
      }
    }

    // Finally delete auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId)
    if (delErr) {
      return new Response(JSON.stringify({ error: "Delete failed", cleanup }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, cleanup }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}, "POST, OPTIONS"))
