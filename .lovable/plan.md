# Refolosire bani din wallet la închirieri

Permite proprietarilor să folosească soldul disponibil din wallet pentru a plăti închirieri pe site, ca alternativă (sau complement) la retragerea bancară.

## Concept

În prezent `availableBalance = totalAllTime - totalWithdrawn - pendingWithdrawals`. Adăugăm o nouă „cheltuială” a soldului: **credit folosit pentru rezervări**. Utilizatorul vede același sold și poate alege la checkout să-l folosească integral, parțial, sau deloc (combinat cu plata cu cardul).

## Modificări backend (Lovable Cloud)

### 1. Tabel nou `wallet_ledger`
Sursă unică de adevăr pentru intrări/ieșiri din wallet:
- `id`, `user_id`, `amount` (semnat: + credit, − debit), `kind` (`earning` | `withdrawal_hold` | `withdrawal_completed` | `rental_credit_hold` | `rental_credit_capture` | `rental_credit_release` | `refund`), `rental_id`, `withdrawal_id`, `created_at`, `metadata`.
- RLS: user vede doar liniile lui; admin tot.
- RPC `get_wallet_balance(_user_id)` returnează `available`, `pending_out`, `total_in`, `total_out` calculate din ledger.
- Migrarea include backfill din `rentals` (owner_payout) și `withdrawal_requests` pentru a păstra istoric.

### 2. RPC `pay_rental_with_wallet(_rental_id, _amount)`
- Verifică: rental aparține lui `auth.uid()`, status `pending`, nu e plătit, suma ≤ `subtotal` rămas, suma ≤ balance disponibil.
- Creează linie `rental_credit_hold` (debit) în ledger.
- Setează pe `rentals`: `wallet_credit_applied`, `payment_method = 'wallet'` sau `'wallet+stripe'`.
- Dacă `wallet_credit_applied >= subtotal` → marchează `payment_status = 'authorized'` și declanșează aceleași notificări ca plata Stripe completă (refolosim logica din `verify-stripe-payment`).
- Dacă parțial → returnează diferența rămasă; UI deschide Stripe Checkout doar pentru rest.

### 3. Edge function `create-checkout-session`
Acceptă param `wallet_amount`. Dacă > 0:
- Apelează `pay_rental_with_wallet` întâi.
- Trimite la Stripe doar `subtotal - wallet_amount`.
- Dacă rest = 0 → întoarce direct success URL fără Stripe.

### 4. Capture / cancel / refund
- La `mutual-cancel-rental` și anulări existente: dacă rental are `wallet_credit_applied > 0`, se inserează linie `rental_credit_release` (credit) → banii revin în wallet automat.
- La capture (final închiriere) hold-ul devine `rental_credit_capture` (debit definitiv, plătit către owner-ul produsului închiriat sub forma `earning` în ledger-ul lui).

## Modificări frontend

### 1. `useEarnings` → folosește RPC nou
Adăugăm câmp `creditOnHold` și menținem `availableBalance` prin RPC. Componentele existente nu se schimbă.

### 2. Card nou „Wallet” pe pagina Earnings
Sub `WalletHeroCard`, două butoane primare: **Retrage bani** (existent) + **Folosește la închirieri** (nou — link spre Search/Categorii cu un toast „Soldul tău va fi disponibil la checkout”).

### 3. Checkout (`src/pages/Checkout.tsx`)
Pas nou (sau bloc în pasul de plată):
- Card „Plătește cu soldul Wallet” cu balance vizibil.
- Toggle ON/OFF + slider/input pentru cât din wallet să folosească (0 → max(balance, subtotal)).
- Recalculează live: `De plătit cu cardul = subtotal − wallet_amount`.
- Dacă `wallet_amount === subtotal` → buton „Plătește cu Wallet” (skip Stripe).
- Altfel → „Continuă spre plată” (trimite `wallet_amount` la edge function).
- Badge clar: „Vei folosi X RON din wallet. Restul Y RON se plătește cu cardul.”

### 4. Mesaje de confirmare
- Email + notificare in-app la owner-ul produsului închiriat: rămâne identic (el încasează normal).
- Notificare pentru renter: „Ai folosit X RON din wallet pentru rezervarea RNT-XXXXXX”.
- Listă tranzacții wallet în pagina Earnings: filtrăm pe `kind` și arătăm „Folosit pentru închirierea …” cu link spre rental.

## Reguli de business

- Wallet nu poate acoperi `delivery_fee` plătit direct către un terț — DA, îl acoperă (face parte din total).
- Suma minimă wallet = 1 RON; sub această sumă restul se plătește integral cu cardul.
- Dacă userul e banat / KYC respins → opțiunea wallet e dezactivată (același gate ca retragerile).
- Restituiri (anulare în <24h cu refund 100%) → automat înapoi în wallet (linia `rental_credit_release`), NU pe card. Excepție: dacă userul cere explicit retragere, intră în fluxul standard de withdrawal.

## Detalii tehnice cheie

```text
ledger lines per rental paid integral cu wallet:
  − rental_credit_hold (renter)        amount = -subtotal
  + earning             (owner produs) amount = +owner_payout  (la capture)
  − rental_credit_capture(renter)      amount = 0 (transformare hold→final)
```

Balance available = SUM(amount) WHERE kind IN (earning, refund, rental_credit_release) − SUM(|amount|) WHERE kind IN (withdrawal_completed, rental_credit_capture, rental_credit_hold pending).

## Scope explicit OUT

- Fără partajare wallet între conturi.
- Fără cashback / bonus la folosire wallet.
- Fără conversie valutară — totul rămâne RON.
