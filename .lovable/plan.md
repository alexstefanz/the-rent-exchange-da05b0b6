## Problem

Stripe checkout finalized but the redirect page shows **"Edge Function returned a non-2xx status code"**.

Edge function logs reveal that `verify-stripe-payment` (and the twin `create-test-checkout-session`) fail with HTTP 500:

```
Update rental error: {
  code: "P0001",
  message: "Not allowed to modify payment/financial rental fields"
}
```

The error comes from the trigger `enforce_rentals_participant_update()` on `public.rentals`. It only lets updates through when the caller is an admin (`has_role(auth.uid(),'admin')`) or when a transaction-local bypass flag is set. Edge functions call the DB with the **service role key** — `auth.uid()` is NULL, no bypass flag is set, so the trigger blocks writes to `payment_status`, `subtotal`, `platform_fee`, `owner_payout`, `refund_amount`, `dispute_status`, `daily_price`, etc.

Effect: after Stripe returns a session id, `verify-stripe-payment` cannot mark the rental as `authorized` / `paid`, the frontend receives 500, and the user sees the red error screen.

## Fix

Update `enforce_rentals_participant_update()` so it also lets the **service role** through — that role is only reachable from edge functions and Postgres admin, never from a signed-in client.

Detect the service role via the JWT claim exposed by PostgREST (`auth.jwt() ->> 'role' = 'service_role'`) as the primary check, with `current_user = 'service_role'` as a defensive fallback. Everything else in the trigger stays the same, so regular renters/owners still cannot mutate financial fields.

Ownership of the fix by layer:

```text
edge function (service_role) ──► rentals UPDATE
                                    │
                          enforce_rentals_participant_update
                                    │
     ┌──── admin?  ───────────────► allow
     ├──── bypass flag on? ───────► allow
     ├──── JWT role = service_role ──► allow   ← NEW
     └──── otherwise ─► block financial-field changes (unchanged)
```

## Steps

1. **Migration** — `CREATE OR REPLACE FUNCTION public.enforce_rentals_participant_update()` with the added service-role short-circuit at the top, keeping every other rule identical (admin bypass, `app.bypass_renter_lock` bypass, blocked column list, error message).
2. **Verification** — from the browser, retry the checkout that failed. Confirm `verify-stripe-payment` returns 200 and the rental moves to `payment_status = authorized`. No client-side code changes required.

## Out of scope

- No change to which fields are protected, to admin logic, to the `pay_rental_with_wallet` bypass flag, or to any RLS policy.
- No change to `create-checkout-session` — it worked; only the post-Stripe verification write was blocked.
