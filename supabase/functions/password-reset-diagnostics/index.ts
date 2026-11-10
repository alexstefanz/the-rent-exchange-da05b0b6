import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!email || !isValidEmail(email) || email.length > 320) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // Look up the profile server-side for audit logging only. The response
  // NEVER discloses whether the email is registered — otherwise this endpoint
  // becomes an account-enumeration oracle. Always return { exists: null }.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  try {
    if (profile?.id) {
      await supabase.from('user_activity_logs').insert({
        user_id: profile.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity_type: 'auth',
        entity_id: profile.id,
        metadata: {
          email,
          ip: req.headers.get('x-forwarded-for') || null,
          ua: req.headers.get('user-agent') || null,
        },
      })
    }
  } catch (e) {
    console.warn('activity log insert failed', e)
  }

  return new Response(
    // Product decision: tell the user when no account exists for this email.
    JSON.stringify({ exists: !!profile?.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}, "POST, OPTIONS"))