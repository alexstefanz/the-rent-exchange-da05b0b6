import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Admin-only: creates a confirmed account with the read-only "insurer" role.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: u } = await userClient.auth.getUser()
    if (!u?.user) return json({ error: 'Unauthorized' }, 401)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: isAdmin } = await admin.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle()
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)

    const { email, password, full_name } = await req.json().catch(() => ({}))
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Email invalid' }, 400)
    if (typeof password !== 'string' || password.length < 10) return json({ error: 'Parola trebuie să aibă minim 10 caractere' }, 400)

    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: full_name || 'Asigurator Rentli' },
    })
    if (error || !created.user) return json({ error: error?.message || 'Create failed' }, 400)
    const id = created.user.id
    await admin.from('profiles').update({ full_name: full_name || 'Asigurator Rentli' }).eq('id', id)
    await admin.from('user_roles').delete().eq('user_id', id)
    const { error: rErr } = await admin.from('user_roles').insert({ user_id: id, role: 'insurer' })
    if (rErr) return json({ error: rErr.message }, 500)
    return json({ ok: true, user_id: id })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
