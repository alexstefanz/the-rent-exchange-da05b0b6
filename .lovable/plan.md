

# Plan: Email Notification on New Odoo Lead

## Approach
Add email sending via Resend (API key already configured) directly in the `odoo-proxy` edge function, triggered after a lead is successfully created.

## Changes

### 1. Update `supabase/functions/odoo-proxy/index.ts`
- After the `create-lead` action successfully creates a lead in Odoo, send an email to `office@rentli.ro` using Resend API
- Email contains lead details: name, contact, email, phone, expected revenue
- Use `RESEND_API_KEY` secret (already configured)
- Sender: `onboarding@resend.dev` (Resend default, works without custom domain) or the project's configured domain if available

### 2. Email Content
- Subject: `Nou lead Rentli: {lead name}`
- Body: HTML table with lead details (name, contact, email, phone, revenue)
- Simple, clean format

No new files needed. No database changes. No UI changes.

