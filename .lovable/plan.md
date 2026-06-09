## Problem

La "Confirm returnarea": `Owners can only set rental status to cancelled from the client (got: completed)`.

## Cauză

`confirmReturn` apelează RPC-ul `confirm_rental_return` (SECURITY DEFINER) care face `UPDATE rentals SET status='completed'`. SECURITY DEFINER nu schimbă `auth.uid()`, deci trigger-ul `enforce_rental_owner_update_restrictions` îl vede pe owner făcând update și blochează orice `status` ≠ `'cancelled'`. Aceeași logică va bloca și alte tranziții legitime owner-driven prin RPC (handover_confirmed_at→active, etc.).

## Fix

Nouă migrare cu `CREATE OR REPLACE FUNCTION public.enforce_rental_owner_update_restrictions()` care:
- elimină blocarea pe `status` pentru owner. Tranzițiile valide sunt deja impuse de RPC-urile SECURITY DEFINER (`confirm_rental_handover`, `confirm_rental_return`, `open_rental_dispute`, cancel flows) și de RLS pe `rentals`.
- păstrează intact restul protecțiilor (subtotal, platform_fee, owner_payout, refund_amount, daily_price, rental_days, start_date, end_date, renter_id, product_id, owner_id, payment_intent_id, paid_at, captured_at, early_return_*) — acestea oricum nu sunt setate de RPC-uri din path-ul PV-ului.

## De ce este sigur

Coloanele financiare/temporale rămân blocate la UPDATE direct de către owner. Restricția pe `status` era duplicată față de logica RPC-urilor și bloca flow-ul corect. Fără ea, owner-ul tot nu poate seta status arbitrar via client direct fără a trece prin RPC, deoarece RLS pe `rentals` permite owner-ului doar update-uri prin RPC-urile autorizate (verificat în migrările existente de hardening).

## Out of scope

UI, RPC-uri, sau alte trigger-e.
