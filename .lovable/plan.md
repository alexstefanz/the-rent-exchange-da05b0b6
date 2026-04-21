

## Plan: Notificările "Cerere trimisă/primită" doar după plata reușită

### Problemă confirmată

În `src/features/rentals/rentalsApi.ts → createRental()` se apelează `send-rental-notification` imediat după inserarea rentalului în DB, **înainte** ca userul să ajungă la Stripe Checkout. Edge function-ul creează:

- notificare în feed pentru renter: "Cerere trimisă cu succes"
- notificare în feed pentru owner: "Cerere nouă de închiriere"
- email către owner: "Cerere nouă de închiriere"
- email către renter: "Cererea ta a fost trimisă"
- transaction `pending`

Astfel, dacă userul abandonează checkout-ul (sau plata eșuează), proprietarul deja a primit email + notificare pentru o cerere care nu există efectiv, iar renterul vede în feed o confirmare pentru o cerere neplătită.

### Soluție

Mut apelul de notificare din momentul creării rentalului → în momentul confirmării plății (în `verify-stripe-payment`), care se rulează doar când Stripe confirmă `requires_capture` sau `succeeded`.

### Modificări

#### 1. `src/features/rentals/rentalsApi.ts`
- **Elimin** apelul `supabase.functions.invoke("send-rental-notification", …)` din `createRental()`.
- Conversația + mesajul către owner rămân la creare (sunt utile chiar dacă plata eșuează — dacă renter trimite mesaj, owner îl vede în mesagerie; dar **nu** se mai trimite notificare/email automat).
- Opțional: și crearea conversației o pot muta tot în post-plată, ca să nu se acumuleze conversații goale. Recomand: mut și conversația după plată (pentru că dacă userul abandonează plata, owner ar primi mesaj despre o cerere fantomă).

#### 2. `supabase/functions/verify-stripe-payment/index.ts`
- După `update rentals` cu succes (când `payment_status` devine `authorized` sau `paid`), **invoc** `send-rental-notification` cu `rental_id`.
- Apelul e fire-and-forget cu try/catch — dacă notificarea eșuează, nu blochează răspunsul către frontend (rentalul e deja plătit corect).

#### 3. `supabase/functions/send-rental-notification/index.ts`
- Modific textele notificărilor pentru a reflecta că plata a fost autorizată:
  - renter: "Cerere trimisă cu succes" → rămâne, dar descrierea devine "Plata ta a fost autorizată. Cererea pentru "X" a fost trimisă proprietarului."
  - owner: "Cerere nouă de închiriere" → rămâne (acum e o cerere reală, plătită).
- Schimb status-ul `transactions.status` din `pending` în `authorized` (reflectă că banii sunt blocați la Stripe, nu doar "în așteptare nedefinit").
- Adaug guard idempotent: dacă există deja o notificare `rental_request` pentru `rental_id` curent, nu o duplic (în caz că `verify-stripe-payment` se apelează de mai multe ori — ex. user dă refresh pe `/checkout/success`).

#### 4. Cleanup vechi (opțional, doar la cerere) 
- Notificările "Cerere trimisă cu succes" deja existente în feed pentru rentaluri cancelled/pending fără plată rămân până când userul le marchează ca citite. Nu le șterg automat — ar putea șterge din greșeală notificări legitime.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/features/rentals/rentalsApi.ts` | Elimin invocarea `send-rental-notification` din `createRental`. Mut crearea conversației + mesajului opțional în flow-ul post-plată (sau o las și invoc din `verify-stripe-payment`) |
| `supabase/functions/verify-stripe-payment/index.ts` | După succes update rental, invoc `send-rental-notification` (+ creare conversație/mesaj dacă a fost transmis prin metadata) |
| `supabase/functions/send-rental-notification/index.ts` | Update copy: descrierile reflectă plata autorizată; transaction status → `authorized`; guard idempotent pe notificări existente |
| `supabase/functions/create-checkout-session/index.ts` | Dacă mut conversația în post-plată: adaug `message_to_owner` în `metadata` Stripe (sau în coloană pe `rentals`) |

### Decizie despre mesajul către owner

Două opțiuni — am nevoie de input:
- **A.** Conversația + mesajul opțional rămân create la pasul actual (înainte de plată). Owner-ul vede mesajul în chat dar **nu** primește email/notificare push până la plată.
- **B.** Și conversația + mesajul se creează doar după plată (mesajul e stocat temporar în coloana `rentals.message_to_owner` sau `Stripe metadata` și inserat în `messages` doar când plata reușește).

Recomand **B** — coerent cu principiul "nimic nu pleacă spre owner până nu s-a plătit". Necesită o coloană nouă `message_to_owner TEXT` pe `rentals` (migrație simplă) sau pasarea prin metadata Stripe.

### Rezultat așteptat

- Renter NU mai vede "Cerere trimisă cu succes" până când Stripe confirmă plata.
- Owner NU mai primește email/notificare/mesaj pentru cereri neplătite.
- Tranzacția în DB apare ca `authorized` doar după hold confirmat — nu mai există tranzacții `pending` orfane.
- `cleanupOrphanRental` din `rentalsApi.ts` rămâne ca safety net dacă crearea sesiunii Stripe eșuează.

### Limitări recunoscute

- Dacă `verify-stripe-payment` eșuează la apelul `send-rental-notification`, plata rămâne corect marcată dar notificarea nu pleacă. Userul primește totuși ecranul de confirmare pe `/checkout/success`. Owner-ul vede cererea când deschide dashboard-ul (e în DB cu `payment_status = authorized`). Pot adăuga un job/cron care să reîncerce notificările lipsă, dar nu e în scop-ul acestui fix.
- Notificările vechi (de la cereri abandonate până acum) rămân în feed.

