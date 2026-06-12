## Current state

Already sent:
- **Welcome** — fires after OTP verification in `Auth.tsx` via `send-general-notification` (old inline HTML), not the branded `welcome.tsx` template.
- **Password changed** — fires from password reset flow (`Auth.tsx → send-password-changed-notification`).
- **KYC approved** — fires from `kycApi.ts` via `kyc-approved` branded template.
- **Account deactivation request** — confirmation link email exists (`account-deactivation` template).

Missing:
- Welcome doesn't always reach users (uses old function; not branded; no fallback path for non-OTP confirm).
- Password change via the in-app "Schimbă parola" flow (uses `resetPasswordForEmail`) doesn't trigger the post-change confirmation.
- No email when **email**, **full name**, or **phone** is updated from `AccountTab`.
- No email when an **IBAN is added** in `WithdrawalMethodCard`.
- No final confirmation email after account is actually **deactivated** (only the request link is sent).

## Changes

### 1. Switch welcome email to the branded template
- In `src/pages/Auth.tsx` (`handleVerifyOtp` and `handlePhoneVerified`), replace `send-general-notification` calls with:
  ```ts
  supabase.functions.invoke("send-transactional-email", {
    body: { templateName: "welcome", recipientEmail, idempotencyKey: `welcome-${userId}`, templateData: { name } }
  })
  ```
- Idempotency key per user guarantees one welcome per account even if the user re-verifies.

### 2. New transactional email templates (`supabase/functions/_shared/transactional-email-templates/`)
Each follows the existing `BaseLayout / H1 / Lead / InfoRow / CTAButton` pattern (same as `email-change.tsx` / `password-changed.tsx`):

- `profile-updated.tsx` — generic "Date cont actualizate" with an `InfoRow` per changed field (Nume / Email / Telefon), CTA to `/contul-meu`, security warning "Nu ai făcut tu această modificare? Contactează suportul".
- `iban-added.tsx` — "IBAN adăugat în contul tău" with masked IBAN (`RO** **** **** **** **** 1234`), CTA to `/castiguri`.
- `account-deactivated.tsx` — "Contul tău a fost dezactivat" sent after successful deactivation, mentions reactivation via support.

Register each in `registry.ts`.

### 3. Wire triggers

**`src/components/profile/AccountTab.tsx` → `handleSubmit`**
- After `updateProfile` succeeds, diff the previous `profile` against the new values; if any of `full_name / email / phone` changed, invoke `send-transactional-email` with `profile-updated`, passing only the changed labels. Idempotency key: `profile-updated-${userId}-${Date.now()}`. Fire-and-forget.

**`src/components/profile/AccountTab.tsx` → `handlePasswordReset`**
- Keep calling `resetPasswordForEmail` (sends the reset link). The actual "parolă schimbată" confirmation already fires in `Auth.tsx → handleSetNewPassword`, so no extra call needed there. No change required.

**`src/components/earnings/WithdrawalMethodCard.tsx` → `handleAdd`**
- After successful insert into `payout_ibans`, invoke `send-transactional-email` with `iban-added`, passing the masked IBAN and account holder name. Idempotency key: `iban-added-${user.id}-${clean}`.

**`supabase/functions/confirm-account-deactivation/index.ts`**
- After successful deactivation, invoke `send-transactional-email` with `account-deactivated` using the user's email captured before deactivation. Idempotency: `account-deactivated-${user.id}`.

### 4. KYC approved
- Already wired (`kyc-approved` template, fired from `kycApi.ts:248`). No change.

## Out of scope
- New welcome content/design (reusing existing `welcome.tsx`).
- Phone OTP change emails (phone change already gated by SMS OTP; we still send `profile-updated` after the OTP completes, in `handlePhoneVerified`).
- Avatar / SMS-notifications-toggle changes — no email (low-signal).
- Deactivation request link email (already exists).
