## Problem

Când chiriașul confirmă PV-ul, apare eroarea:
`record "new" has no field "deposit_amount"`

## Cauză

În migrarea `20260609114211_*.sql` (hardening din scanul Wiz) am creat trigger-ul `enforce_rental_owner_update_restrictions` pe tabela `public.rentals` care verifică `NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount`. Tabela `rentals` **nu are coloana `deposit_amount`** (verificat în schema). Orice UPDATE pe rentals (inclusiv cel făcut de confirmarea PV-ului) declanșează trigger-ul și eșuează imediat la parsing.

## Fix

O nouă migrare care înlocuiește funcția `public.enforce_rental_owner_update_restrictions()` eliminând linia cu `deposit_amount` din lista de coloane protejate. Restul logicii (subtotal, platform_fee, owner_payout, refund_amount, daily_price, rental_days, start_date, end_date, renter_id, product_id, owner_id, stripe_*, paid_at, captured_at, owner_payout_released_at, early_return_*) rămâne neschimbat. Trigger-ul nu trebuie recreat — doar `CREATE OR REPLACE FUNCTION`.

## Out of scope

- Nicio modificare în UI / `InspectionDialog` / `ownerRentalsApi`.
- Nicio modificare la alte trigger-e sau policies din hardening.
