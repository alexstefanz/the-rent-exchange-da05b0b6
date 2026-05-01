## Obiectiv

Atunci când un produs este închiriat, să se creeze ÎNTOTDEAUNA o conversație nouă (separată) — chiar dacă chiriașul a mai discutat sau a mai închiriat acel produs în trecut. Titlul conversației afișat în lista de mesaje trebuie să arate: **titlul produsului + perioada închirierii (data început – data sfârșit) + numărul de zile**.

Conversațiile organice pre-rezervare (cele deschise din pagina produsului prin „Întreabă proprietarul") rămân ca acum — un singur fir per (produs, chiriaș). Doar la momentul rezervării plătite se naște o conversație nouă, „ancorată" rezervării respective.

## Schimbări în baza de date

1. **Eliminăm constrângerea unică** `conversations_product_id_buyer_id_key` care actualmente forțează un singur chat per (produs, chiriaș). Astfel pot exista mai multe conversații între aceiași doi utilizatori pentru același produs.
2. **Adăugăm coloana** `rentals_id uuid NULL` pe `conversations`, cu `FK -> rentals(id) ON DELETE SET NULL` și `UNIQUE` (o singură conversație per rezervare).
   - `NULL` = conversație organică (ca azi, „Întreabă proprietarul").
   - Setată = conversație creată automat la confirmarea plății pentru acea rezervare.
3. **Nouă funcție RPC** `get_or_create_rental_conversation(p_rental_id uuid)` (SECURITY DEFINER) care:
   - Validează că apelantul este `renter_id` sau `owner_id` al rezervării.
   - Întoarce conversația existentă cu `rentals_id = p_rental_id` dacă există, altfel o creează (folosind `product_id`, `renter_id` ca `buyer_id`, `owner_id` din rental).
   - Garantează idempotență (siguranță la dublu-click / retry).
4. **Actualizăm RPC-ul** `get_user_conversations` ca să returneze și `rentals_id`, `rental_start_date`, `rental_end_date`, `rental_days` (LEFT JOIN pe `rentals`). Acestea sunt folosite în UI pentru titlul conversației.

## Schimbări în cod

### `src/features/messaging/messagingApi.ts`
- Extindem interfața `Conversation` cu câmpurile noi: `rentals_id`, `rental?: { start_date, end_date, rental_days }`.
- Adăugăm funcție nouă `getOrCreateRentalConversation(rentalId: string)` care apelează RPC-ul nou.
- `getOrCreateConversation(productId, ownerId)` rămâne neschimbată pentru chat-ul organic — DAR adăugăm filtrul `.is('rentals_id', null)` la SELECT și INSERT-ul setează `rentals_id: null`. Astfel nu mai „găsește" conversațiile de rezervare și nu strică firul organic.
- `getConversations()` mapează noile câmpuri în obiectul returnat.

### `src/components/booking/BookingConfirmation.tsx`
- Primește în plus `rentalId: string`.
- Butonul „Discută cu proprietarul" apelează `getOrCreateRentalConversation(rentalId)` în loc de `getOrCreateConversation`.

### `src/pages/CheckoutSuccess.tsx`
- Pasează `rentalId={rentalData.id}` către `BookingConfirmation` (deja avem `rentalData.id`).

### `src/components/dashboard/RequestsTab.tsx` și `RentalsTab.tsx`
- Butonul „Mesaje" din lista cererilor / închirierilor folosește `getOrCreateRentalConversation(rental.id)` în loc de `getOrCreateConversation(product_id, owner_id)`. Astfel proprietarul și chiriașul aterizează amândoi în firul dedicat acelei rezervări.

### `src/components/messaging/ConversationList.tsx`
- Când `conv.rental` există, titlul afișat devine, în RO:
  > „{titlu produs} · {start_date} – {end_date} ({n} zile)"
  
  iar în EN: același pattern cu „days".
- Când `conv.rental` lipsește (chat organic), rămâne doar titlul produsului — comportament actual.

### `src/components/messaging/ChatPanel.tsx` (header chat)
- Sub numele celuilalt utilizator, dacă există context de rental, afișăm un mic subtitlu cu perioada și numărul de zile, ca să fie clar despre ce rezervare e vorba.

## Comportament rezultat

- Chat organic (din pagina produsului): un singur fir per (produs, chiriaș), neatins.
- Fiecare rezervare plătită → fir nou separat, cu titlu îmbogățit: „Playstation 5 · 12 mai – 15 mai 2026 (3 zile)".
- A doua oară când același chiriaș închiriază același produs → al doilea fir nou, distinct.
- Atât proprietarul, cât și chiriașul văd toate firele lor în tab-urile „Rezervări" / „De Închiriat" exact ca azi.

## Fișiere care vor fi modificate

- migrare nouă SQL (drop unique, add column, add RPC, update get_user_conversations)
- `src/features/messaging/messagingApi.ts`
- `src/components/booking/BookingConfirmation.tsx`
- `src/pages/CheckoutSuccess.tsx`
- `src/components/dashboard/RequestsTab.tsx`
- `src/components/dashboard/RentalsTab.tsx`
- `src/components/messaging/ConversationList.tsx`
- `src/components/messaging/ChatPanel.tsx`

## Aspecte care NU se schimbă

- RLS pe `conversations` rămâne identic (participantul vede firele lui).
- Conversațiile vechi (existente azi) rămân nemodificate; vor avea `rentals_id = NULL` și se comportă în continuare ca fire organice.
- Nu migrăm retroactiv conversațiile vechi în fire pe rezervări — ar fi ambiguu (un fir conține deseori discuții despre mai multe rezervări succesive).
