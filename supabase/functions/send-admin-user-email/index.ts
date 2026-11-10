import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { sendAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'

// Notices about admin/support actions (product moderation, bans, tickets).
// Recipient is resolved server-side from the target user's profile.
// Admins may notify any user; a non-admin may only trigger their own ticket-created notice.
const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const TEMPLATES = ['product-published', 'product-rejected', 'account-banned', 'ticket-created', 'ticket-replied', 'ticket-resolved'] as const

const Body = z.object({
  templateName: z.enum(TEMPLATES),
  userId: z.string().uuid(),
  idempotencyKey: z.string().min(1).max(200),
  templateData: z.record(z.union([z.string().max(2000), z.number(), z.null()])).optional(),
})

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const b = parsed.data

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  const selfTicket = b.templateName === 'ticket-created' && b.userId === user.id
  if (isAdmin !== true && !selfTicket) return json({ error: 'Forbidden' }, 403)

  const { data: profile } = await admin.from('profiles').select('email, full_name').eq('id', b.userId).maybeSingle()
  if (!profile?.email) return json({ success: false, reason: 'no_email' })

  try {
    const result = await sendAppEmail({
      templateName: b.templateName,
      recipientEmail: profile.email,
      idempotencyKey: b.idempotencyKey,
      templateData: { name: profile.full_name || undefined, ...(b.templateData ?? {}) },
    })
    return json(result)
  } catch (e) {
    console.error('send-admin-user-email failed', (e as Error).message)
    return json({ error: 'send_failed' }, 500)
  }
}, "POST, OPTIONS"))
