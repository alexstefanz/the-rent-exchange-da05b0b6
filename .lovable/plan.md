## Problem

In `supabase/functions/notify-rental-event/index.ts`, two cancellation-related events only notify one party:

- **`request_rejected`** → `recipients: "renter"` (owner who rejected gets nothing)
- **`request_cancelled_by_renter`** → `recipients: "owner"` (renter who cancelled gets nothing)

All other cancellation events (`cancel_request_submitted/withdrawn/approved/rejected`, `cancellation_confirmed`, `mutual_cancel_approved`) already correctly use `"both"`.

## Change

Edit `supabase/functions/notify-rental-event/index.ts` only — flip both events to `recipients: "both"` and split the in-app copy per role so each party sees a natural message.

### `request_rejected` → both

- **Renter** title: "Cererea a fost refuzată" / desc: "Cererea pentru \"X\" a fost refuzată"
- **Owner** title: "Ai refuzat cererea" / desc: "Ai refuzat cererea pentru \"X\""

### `request_cancelled_by_renter` → both

- **Owner** title: "Cerere de închiriere anulată" / desc: "Chiriașul a anulat cererea pentru \"X\""
- **Renter** title: "Ai anulat cererea" / desc: "Ai anulat cererea pentru \"X\""

### Implementation detail

The event config currently uses single `inAppTitle` / `inAppDesc` objects shared by both recipients. To support per-role copy, change `inAppTitle` and `inAppDesc` for these two events into functions/objects that read the recipient role and return appropriate text. The downstream insert loop (where `recipients` is iterated and a `notifications` row is created per recipient) needs to pass the role to the title/desc resolver.

Keep `emailTemplate.renter` / `smsTemplate` unchanged so the rejected/cancelling counterpart still gets the same email + SMS — the second in-app entry is in-app only (no extra email/SMS) to avoid duplicate channel noise.

## Files touched

- `supabase/functions/notify-rental-event/index.ts` — only file changed
- No DB migration, no frontend changes

After deploy, the cancellation realtime → bottom-center toast pipeline (already wired in `useGlobalRealtime` + `notify.tsx`) will deliver red toasts to both parties.
