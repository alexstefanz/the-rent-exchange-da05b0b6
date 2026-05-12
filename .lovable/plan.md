## Obiectiv
Permite adminilor să facă plăți de test reale (card 4242) prin Stripe în modul test, fără bani reali, marcând clar rezervarea ca „plată de test" în dashboard.

## Cum va funcționa pentru admin
1. În pagina de Checkout, dacă utilizatorul logat are rolul `admin`, apare un buton suplimentar discret: **„Plătește cu card de test (Admin)"** lângă butonul normal de plată.
2. Butonul deschide o sesiune Stripe Checkout în **modul test** (folosind o cheie sk_test_ separată). Adminul folosește `4242 4242 4242 4242`, orice CVV, dată viitoare.
3. La succes, rezervarea este marcată ca plătită + `is_test_payment = true`.
4. În toate locurile unde apare rezervarea (Dashboard, Rezervări, Admin), apare o etichetă galbenă mică **„🧪 Card de test"** lângă status.

## Pași de implementare

### 1. Secret nou
- Cer adminul să adauge `STRIPE_TEST_SECRET_KEY` (cheia `sk_test_...` din Stripe Dashboard → Developers → API keys → Test mode).
- Cheia live existentă rămâne neatinsă.

### 2. Bază de date (migrație)
- Adaugă coloană `is_test_payment BOOLEAN NOT NULL DEFAULT false` pe `rentals`.
- Expune câmpul în RPC-urile `get_admin_rentals` și în query-urile de listare rezervări.

### 3. Edge function nouă: `create-test-checkout-session`
- Identică cu `create-checkout-session`, cu diferențele:
  - Verifică explicit că `user.id` are rolul `admin` în `user_roles` (refuz altfel).
  - Folosește `STRIPE_TEST_SECRET_KEY` în loc de `STRIPE_SECRET_KEY`.
  - Sare peste verificarea KYC (test admin).
  - Adaugă `metadata.is_test = "true"` în session și payment_intent.
  - După creare session, setează `is_test_payment = true` pe rental.
- `verify_jwt = true` (default) ca să citim user-ul.

### 4. Verify/capture
- `verify-stripe-payment` și `capture-rental-payment`: când rental.is_test_payment = true, folosesc `STRIPE_TEST_SECRET_KEY`. Altfel, cheia live (comportament actual).
- Aceeași logică pentru `cancel-rental-by-renter` și orice flow care face refund.

### 5. Frontend — Checkout
- În `Checkout.tsx`, detectez rolul admin (hook existent / `has_role`). Dacă e admin, afișez buton secundar cu icoană beaker: **„Card de test (admin)"**, care apelează noua edge function.
- Toast informativ: „Mod test — nu se debitează bani reali. Folosește cardul 4242 4242 4242 4242."

### 6. Badge „Card de test" în UI
Apare oriunde se afișează status rezervare:
- `src/components/dashboard/StatusBadge.tsx` (sau direct în card)
- Dashboard renter (`RentalsPage`), owner (`RentalsOutPage`)
- Admin: `AdminReservations`, `AdminDashboard` (Ultimele Rezervări)
- Email/notificări: nemodificate (rămân normale)

Stil badge: `bg-yellow-100 text-yellow-800 border-yellow-300`, text: „🧪 Test".

### 7. Filtrare admin
- În `AdminReservations`, adaug un filtru rapid „Doar test / Doar real / Toate" pentru a putea exclude testele din rapoarte.

## Detalii tehnice
- Fără webhook nou — folosim flow-ul existent verify+capture, doar cu cheia corespunzătoare.
- Fără modificări la calcul comision sau payouts (testele nu generează payout, dar acest lucru poate fi prevenit în `process-rental-captures` filtrând `is_test_payment = false` la generarea `owner_payouts`).
- Logăm fiecare folosire a butonului test în `user_activity_logs` cu acțiunea `admin_test_payment`.

## Out of scope
- Nu adăugăm UI public pentru utilizatori non-admin.
- Nu modificăm fluxul live de plată.
- Nu schimbăm KYC-ul în producție.
