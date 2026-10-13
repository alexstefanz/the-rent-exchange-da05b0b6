import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.3.1'
import { TEMPLATES } from './registry.ts'
import { EmailThemeContext } from './_components.tsx'

// Server-only. Direct managed send that keeps Rentli's per-send behavior:
// role theming (renter navy / owner orange) and subject suffixes.
const SITE_NAME = 'Rentli'
const SENDER_DOMAIN = 'notify.rentli.ro'
const FROM_DOMAIN = 'rentli.ro'

export interface AppEmailRequest {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
  subjectSuffix?: string | null
  threadSubject?: string | null
  // Accepted for compatibility; threading headers are not supported by managed delivery.
  threadKey?: string | null
}

export type AppEmailResult =
  | { success: true; sent: true }
  | { success: false; sent: false; reason: 'email_suppressed' }

async function log(row: Record<string, unknown>) {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return
    const { error } = await createClient(url, key).from('email_send_log').insert(row)
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  } catch (e) {
    console.error('email_send_log insert threw', (e as Error).message)
  }
}

export async function sendAppEmail(req: AppEmailRequest): Promise<AppEmailResult> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured')
  const template = TEMPLATES[req.templateName]
  if (!template) throw new Error(`Template '${req.templateName}' not found`)
  const recipient = template.to || req.recipientEmail
  if (!recipient) throw new Error('recipientEmail is required')

  const templateData = req.templateData ?? {}
  const role =
    templateData.recipientRole === 'renter' || templateData.recipientRole === 'owner'
      ? templateData.recipientRole
      : /-renter$/.test(req.templateName) ? 'renter' : 'owner'
  const themed = () =>
    React.createElement(EmailThemeContext.Provider, { value: role }, React.createElement(template.component, templateData))
  const html = await renderAsync(themed())
  const text = await renderAsync(themed(), { plainText: true })
  const base = typeof template.subject === 'function' ? template.subject(templateData) : template.subject
  const suffix = req.subjectSuffix?.slice(0, 120)
  const threadSubject = req.threadSubject?.slice(0, 120)
  const subject = suffix ? `${base} · ${suffix}` : threadSubject ? `${threadSubject} — ${base}` : base

  try {
    await sendLovableEmail(
      {
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: req.templateName,
        idempotency_key: req.idempotencyKey || crypto.randomUUID(),
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      await log({ message_id: null, template_name: req.templateName, recipient_email: recipient, status: 'suppressed' })
      return { success: false, sent: false, reason: 'email_suppressed' }
    }
    const msg = error instanceof Error ? error.message : String(error)
    await log({ message_id: null, template_name: req.templateName, recipient_email: recipient, status: 'failed', error_message: msg.slice(0, 1000) })
    throw error
  }
  await log({ message_id: null, template_name: req.templateName, recipient_email: recipient, status: 'sent' })
  return { success: true, sent: true }
}
