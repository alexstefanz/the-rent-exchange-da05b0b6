import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Webhook } from 'npm:svix@1.42.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  'Access-Control-Allow-Headers': '*',
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function redact(email: string): string {
  const [u, d] = email.split('@')
  return `${u?.[0] ?? '?'}***@${d ?? '?'}`
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !supabaseUrl || !serviceKey) {
    console.error('Missing env vars', {
      has_secret: !!webhookSecret,
      has_url: !!supabaseUrl,
      has_key: !!serviceKey,
    })
    return json({ error: 'Server configuration error' }, 500)
  }

  const payload = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let event: any
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(payload, headers)
  } catch (err) {
    console.error('Signature verification failed', { error: (err as Error).message })
    return json({ error: 'Invalid signature' }, 401)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const type: string = event?.type ?? 'unknown'
  const data = event?.data ?? {}
  const resendId: string | undefined = data?.email_id ?? data?.id
  const toArr: string[] = Array.isArray(data?.to) ? data.to : data?.to ? [data.to] : []
  const email: string | undefined = toArr[0]?.toLowerCase()

  console.log('Resend webhook received', { type, resend_id: resendId, recipient: email ? redact(email) : null })

  try {
    switch (type) {
      case 'email.delivered': {
        if (resendId) {
          await supabase
            .from('email_send_log')
            .update({ status: 'sent', error_message: null })
            .eq('metadata->>resend_id', resendId)
        }
        break
      }
      case 'email.bounced': {
        const bounceType = data?.bounce?.type ?? data?.bounce_type
        const isHard = !bounceType || String(bounceType).toLowerCase().includes('hard') || String(bounceType).toLowerCase() === 'permanent'

        if (email && isHard) {
          await supabase.from('suppressed_emails').upsert(
            {
              email,
              reason: 'bounce',
              metadata: { source: 'resend', bounce: data?.bounce ?? null, resend_id: resendId ?? null },
            },
            { onConflict: 'email' },
          )
        }

        await supabase.from('email_send_log').insert({
          message_id: resendId ?? null,
          template_name: 'system',
          recipient_email: email ?? 'unknown',
          status: 'bounced',
          error_message: `Resend bounce${bounceType ? ` (${bounceType})` : ''}`,
          metadata: { source: 'resend', event: data },
        })
        break
      }
      case 'email.complained': {
        if (email) {
          await supabase.from('suppressed_emails').upsert(
            {
              email,
              reason: 'complaint',
              metadata: { source: 'resend', resend_id: resendId ?? null },
            },
            { onConflict: 'email' },
          )
        }
        await supabase.from('email_send_log').insert({
          message_id: resendId ?? null,
          template_name: 'system',
          recipient_email: email ?? 'unknown',
          status: 'complained',
          error_message: 'Resend complaint (marked as spam)',
          metadata: { source: 'resend', event: data },
        })
        break
      }
      case 'email.delivery_delayed':
      case 'email.opened':
      case 'email.clicked':
      case 'email.sent': {
        // Informational only — no state change.
        break
      }
      default: {
        console.log('Unhandled Resend event type', { type })
      }
    }
  } catch (err) {
    console.error('Failed to process Resend event', { type, error: (err as Error).message })
    return json({ error: 'Processing failed' }, 500)
  }

  return json({ success: true })
}, "POST, OPTIONS"))
