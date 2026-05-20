# Show clear feedback when login password is wrong

## Problem
On the `/autentificare` page, submitting a wrong password leaves the user without any visible feedback — the spinner finishes, no toast is perceived, and the form just sits there. Today the only feedback path is a destructive toast, which can be missed (auto-dismisses, can overlap with other UI, or is suppressed when there's a quickly-following navigation/re-render).

## Changes (frontend only)

### 1. `src/pages/Auth.tsx`
- Add a local `loginError: string | null` state.
- In `handleLogin`:
  - Wrap `signIn(...)` in `try/catch/finally` so `setIsLoading(false)` and `setGatingLogin(false)` always run, even if the SDK throws (e.g. transient network/rate-limit error).
  - Trim the email (`data.email.trim().toLowerCase()`) before calling `signIn` to avoid silent mismatches from autofill whitespace.
  - On error: set `loginError` to a friendly message derived from the Supabase error:
    - `invalid_credentials` / "Invalid login credentials" → "Email sau parolă incorecte." / "Invalid email or password."
    - `email_not_confirmed` → existing "verifică emailul" copy.
    - rate-limit (`over_request_rate_limit`, status 429) → "Prea multe încercări. Așteaptă câteva minute." / "Too many attempts. Wait a few minutes."
    - fallback → original error message or generic copy.
  - Keep the existing destructive toast as a secondary channel.
  - Clear `loginError` at the start of each submit and when the user edits email or password (`loginForm.watch` subscription or `onChange` on the inputs).
- Render an inline error block immediately under the password field (before the submit button) when `loginError` is set:
  - Uses `bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-3 py-2 text-sm`, with an `AlertCircle` icon and `role="alert"` for accessibility.
  - Persistent until the user retypes — does not auto-dismiss like the toast.

### 2. No backend / no schema / no Auth provider changes
The Supabase auth API already returns the correct 400 with `invalid_credentials`; only the UI surfacing needs work. `signIn` in `AuthContext` already returns `{ error }` and doesn't need to change.

## Out of scope
- Register / password reset / OTP flows (already have their own feedback).
- Social login buttons.
- Any change to `AuthContext`, RLS, or email templates.

## Verification
1. Enter a valid email + wrong password → spinner stops, inline red alert appears under the password field reading "Email sau parolă incorecte." and a destructive toast also fires.
2. Edit the password field → inline alert disappears.
3. Trigger 6+ rapid failed attempts → inline alert switches to the rate-limit copy.
4. Successful login still navigates to `/` with the welcome toast.
