## Problem

`record "new" has no field "stripe_payment_intent_id"` la semnarea/confirmarea PV-ului.

## Cauză

Trigger-ul `enforce_rental_owner_update_restrictions` (din migrarea de hardening Wiz) verifică:
- `NEW.stripe_payment_intent_id` — nu există în `rentals` (coloana se numește `payment_intent_id`)
- `NEW.stripe_session_id` — nu există deloc

Orice UPDATE pe `rentals` eșuează la parsing-ul trigger-ului.

## Fix

Nouă migrare cu `CREATE OR REPLACE FUNCTION public.enforce_rental_owner_update_restrictions()` care:
- înlocuiește `NEW.stripe_payment_intent_id` cu `NEW.payment_intent_id` (coloana reală)
- elimină verificarea pe `stripe_session_id` (coloana nu există)
- păstrează restul protecțiilor (subtotal, platform_fee, owner_payout, refund_amount, daily_price, rental_days, start_date, end_date, renter_id, product_id, owner_id, paid_at, captured_at, owner_payout_released_at*, early_return_*) și restricția de status pentru owner

*Notă: `owner_payout_released_at` nu apare în lista coloanelor — voi elimina și acea verificare ca să nu reapară aceeași clasă de eroare.

## Out of scope

Nicio modificare în UI sau alte trigger-e.
