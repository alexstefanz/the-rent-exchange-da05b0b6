import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { sendAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'

// Account notices to the signed-in user only. Recipient = the caller's own
// verified account email; template is chosen from a fixed list.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const Body = z.discriminatedUnion('event', [
  z.object({ event: z.literal('welcome') }),
  z.object({
    event: z.literal('iban-added'),
    maskedIban: z.string().max(64),
    holderName: z.string().max(200).optional(),
  }),
  z.object({
    event: z.literal('profile-updated'),
    changes: z.array(z.object({ label: z.string().max(60), value: z.string().max(300) })).min(1).max(10),
  }),
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await client.auth.getUser()
  if (!user?.email) return json({ error: 'Unauthorized' }, 401)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const b = parsed.data

  try {
    let result
    if (b.event === 'welcome') {
      result = await sendAppEmail({
        templateName: 'welcome',
        recipientEmail: user.email,
        idempotencyKey: `welcome-${user.id}`,
        templateData: { name: user.user_metadata?.full_name || '' },
      })
    } else if (b.event === 'iban-added') {
      result = await sendAppEmail({
        templateName: 'iban-added',
        recipientEmail: user.email,
        idempotencyKey: `iban-added-${user.id}-${b.maskedIban}`,
        templateData: { maskedIban: b.maskedIban, holderName: b.holderName },
      })
    } else {
      result = await sendAppEmail({
        templateName: 'profile-updated',
        recipientEmail: user.email,
        idempotencyKey: `profile-updated-${user.id}-${Date.now()}`,
        templateData: { changes: b.changes },
      })
    }
    return json(result)
  } catch (e) {
    console.error('send-account-email failed', (e as Error).message)
    return json({ error: 'send_failed' }, 500)
  }
})
