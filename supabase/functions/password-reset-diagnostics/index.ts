import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

Deno.serve(async (req) => {
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

  // Look for the user in the public.profiles table (synced from auth.users via trigger).
  // We avoid admin.listUsers because it paginates and is slow at scale.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle()

  if (error) {
    console.error('profile lookup failed', error)
    // Fail open: do not leak details, but tell client to proceed normally.
    return new Response(
      JSON.stringify({ exists: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Best-effort audit log so we know recovery requests are arriving.
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
    JSON.stringify({ exists: Boolean(profile) }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})