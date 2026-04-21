

## Plan: Testare end-to-end a întregului proces Rentli

### Context
Vrei o validare completă a fluxului platformei: înregistrare → confirmare email → adăugare anunț → toate scenariile de rezervare → finalizare. Acest tip de testare necesită rularea browserului automatizat pe preview și interacțiune secvențială cu UI-ul, plus verificări în DB și edge function logs pentru a confirma că fiecare pas declanșează corect logica backend.

### Scope și abordare

Test end-to-end automat pe **preview-ul live**, cu 2 conturi de test:
- **Conturile de test**: voi folosi 2 emailuri unice (ex: `test-renter-{timestamp}@rentli.test` și `test-owner-{timestamp}@rentli.test`)
- **Atenție OTP**: înregistrarea folosește OTP de 8 cifre pe email. Pentru a putea finaliza signup-ul automat, voi confirma conturile de test direct prin SQL (`UPDATE auth.users SET email_confirmed_at = now()`) — bypass OTP doar pentru testare
- **Atenție Stripe**: voi folosi cardul de test Stripe `4242 4242 4242 4242` care declanșează autorizare reușită fără 3DS

### Plan de execuție — 7 faze

#### Faza 1: Înregistrare + confirmare cont
- Deschid `/auth`, signup pentru proprietar (email + parolă + nume)
- Verific în DB că `auth.users` și `profiles` au înregistrarea (trigger `handle_new_user`)
- Bypass OTP via SQL pentru cont test
- Login → verific sesiune activă
- Repet pentru chiriaș

#### Faza 2: Adăugare anunț (proprietar)
- Login proprietar → `/anunt-nou`
- Completez fluxul de 6 pași: Titlu → Imagini (upload poze test din `/tmp`) → Categorie/Subcategorie → Preț → Descriere → Locație/Pickup
- Submit → verific în DB:
  - `products` row creat cu `approval_status='pending'`
  - `user_activity_logs` are `PRODUCT_CREATED`
- **Aprobare admin**: prin SQL setez `approval_status='approved'` (simulez aprobarea)
- Verific produsul vizibil pe `/cautare`

#### Faza 3: Rezervare reușită (chiriaș)
- Login chiriaș → caut produsul → deschid pagina de produs
- Selectez date din calendar → click "Rezervă"
- Parcurg checkout-ul (4 pași) → accept termeni
- Plată cu card test Stripe → redirect la `/checkout/success`
- Verific:
  - `rentals` row cu `status=pending`, `payment_status=authorized`
  - `payment_intent_id` setat
  - Notificare creată pentru proprietar
- Validez **Pasul 1** "Cerere trimisă" în timeline

#### Faza 4: Acceptare cerere (proprietar)
- Login proprietar → `/profile` → tab "Închirieri"
- Click "Acceptă cererea"
- Verific:
  - `status=confirmed`, `confirmed_at` setat
  - Edge function `respond-rental-request` apelat cu succes (logs)
  - Email/notificare trimis chiriașului
- Validez **Pașii 2 și 3** activi în timeline

#### Faza 5: Confirmare predare (proprietar)
- Click "Confirmă predarea" → completez inspecția checkout (10 poze test)
- Verific:
  - `handover_confirmed_at` setat
  - `status=active`
  - `rental_inspections` row cu `phase=checkout`
- Validez **Pasul 4** "Produs în folosire" activ

#### Faza 6: Notificare ultima zi + Finalizare
- Apelez direct edge function `notify-return-day` (curl) pentru rentalul de test (simulez ultima zi)
- Verific notificare creată în `notifications` pentru chiriaș
- Validez **Pasul 5** activ
- Login proprietar → click "Confirm returnarea (totul OK)"
- Completez inspecție checkin (10 poze)
- Verific:
  - `return_confirmed_at` setat
  - `status=completed`
  - Edge function `capture-rental-payment` apelat → Stripe capture confirmat în logs
  - `transactions` row de tip `owner_payout` creat
  - Balanța proprietarului reflectă suma
- Validez **Pasul 6** "Finalizat"

#### Faza 7: Scenariu negativ — Respingere cu refund
- Creez o a doua rezervare (chiriaș → produs)
- Plată Stripe → autorizat
- Login proprietar → click "Respinge" cu motiv
- Verific:
  - `status=cancelled`, `refunded_at` setat, `payment_status=refunded`
  - Stripe Payment Intent cancelled (verific via stripe API)
  - Notificare refund către chiriaș
- Validez timeline cu badge "Anulată / Bani returnați"

### Verificări încrucișate per fază

Pentru fiecare fază voi captura:
1. **Screenshot** din UI (dovada vizuală)
2. **Query SQL** pentru starea DB
3. **Edge function logs** pentru funcțiile triggerate
4. **Console logs** din browser pentru erori

### Curățare după test

La final, șterg datele de test:
- `DELETE FROM rentals WHERE renter_id IN (test_ids)`
- `DELETE FROM products WHERE owner_id IN (test_ids)`
- `DELETE FROM auth.users WHERE email LIKE '%@rentli.test'`

### Output livrat

Raport structurat cu:
- ✅ / ❌ per fază + sub-pas
- Screenshot-uri cheie (UI după fiecare confirmare majoră)
- Bug-uri descoperite (cu fișier + linie + cauză)
- Recomandări de fix-uri (fără a le aplica — doar raport)

### Limitări cunoscute
- **3DS / SCA**: nu pot completa flow-uri 3DS interactive. Folosesc cardul `4242` care le evită
- **OTP real pe email**: nu pot citi inbox-uri reale → folosesc bypass SQL pentru conturile de test
- **Webhooks Stripe live**: dacă există webhook-uri, ele vor rula normal în background
- **Browser flaky**: dacă browser-ul refuză să pornească, raportez ce am putut testa pe parte de DB/edge functions și cer permisiunea să continui manual

### Durată estimată
15–25 minute de execuție automatizată (depinde de viteza preview-ului și a Stripe).

### Fișiere afectate
**Niciunul** — testarea este non-destructivă pentru cod. Doar inserări/ștergeri în DB pentru date de test, marcate clar cu sufix `@rentli.test`.

