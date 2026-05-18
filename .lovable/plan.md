## Probleme identificate

**A. Notificare eronată "Plată primită — începe chatul"** la creare cerere
- `supabase/functions/send-rental-notification/index.ts` inserează o notificare către proprietar cu textul „Plată primită — începe chatul" și descriere „X a efectuat plata pentru produsul…". În realitate la acest moment plata este DOAR autorizată (hold Stripe), capture-ul se face abia după ce proprietarul acceptă cererea.
- În plus, `notify-rental-event` cu `request_created` deja trimite notificarea corectă „Cerere nouă de închiriere" către ambii utilizatori → notificarea din `send-rental-notification` este și **duplicată**, și **greșită semantic**.
- Același lucru se întâmplă cu emailul: `rental-request-owner.tsx` are titlu „Plată primită — începe chatul" — confuz.

**B. Rezervarea nu apare REALTIME pentru proprietar pe pagina /inchirieri**
- `useGlobalRealtime` invalidează cheile `["owner-rentals"]` și `["my-rentals"]` la INSERT/UPDATE pe `rentals` cu `owner_id=eq.${userId}`.
- Dar `src/components/dashboard/RentalsOutTab.tsx` folosește cheia **`["ownerRentals", user?.id]`** (camelCase), care **niciodată** nu este invalidată → lista cererilor primite nu se actualizează decât după refresh manual.
- Tabela `rentals` este în publication, RLS OK, JWT-ul Realtime e deja sincronizat (fix din turul precedent). Singura cauză rămasă: mismatch cheie cache.

## Modificări

### 1. `supabase/functions/send-rental-notification/index.ts`
- Șterg complet blocul `await supabaseAdmin.from("notifications").insert([...])` (cele 2 notificări duplicate).
- Șterg blocurile `sendBranded("rental-request-owner", …)` și `sendBranded("rental-request-renter", …)` — emailurile sunt deja trimise de `notify-rental-event request_created`.
- Păstrez: inserția în `transactions` (status `authorized`) și apelul RPC `get_or_create_rental_conversation` (utile pentru chat + tracking financiar).
- Funcția devine un "side-effects worker" curat: tranzacție + conversație. Fără notificări/emailuri duplicate.

### 2. `supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx`
- Schimb titlul `H1` și `subject`/`displayName` din „Plată primită — începe chatul" în **„Cerere nouă de închiriere"** / subject: „Cerere nouă pentru {produs}".
- Schimb `preview` și `Lead` ca să spună clar: „X dorește să închirieze produsul tău. Plata este autorizată (blocată) și va fi încasată după ce acceptați cererea."
- CTA rămâne „Vezi cererea" → `/rezervari/{publicId}` (sau `/inchirieri` dacă nu avem public_id).
- Această schimbare se reflectă oricum prin canalul `notify-rental-event` care folosește același template.

### 3. `src/hooks/useGlobalRealtime.ts`
- Pe handler-ele de `rentals` (owner_id și renter_id), adaug în lista de chei și `["ownerRentals"]` respectiv `["myRentals"]` ca să acopere ambele convenții.
- Restul cheilor (`account-dashboard`, `earnings`, `wallet-balance`, `rental`, `rental-payment-status`) rămân.

### 4. QA
- Curăț notificările vechi greșite pentru testarea finală (opțional, doar pentru claritate vizuală — nu se modifică DB, las în viață).
- Cu user `alesso.cwalk@yahoo.com` logat pe `/inchirieri`, dintr-o altă sesiune creez o cerere → verific:
  - Rezervarea apare instant în listă (fără refresh).
  - Notificarea „Cerere nouă de închiriere" apare în clopoțel (fără cea de „Plată primită").
  - Emailul are subiect „Cerere nouă pentru …".

Niciun edit la RLS, schema DB, sau la fluxul Stripe.