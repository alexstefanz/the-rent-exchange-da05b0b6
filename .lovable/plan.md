## Obiectiv
Când un utilizator primește un review (de produs sau de utilizator), să primească o notificare în clopotul de notificări cu textul de tip "Ai primit un review pentru …".

## Stare actuală
- `createProductReview` (în `productReviewsApi.ts`) apelează deja edge function `send-general-notification` cu `type: "review_received"`, care inserează în `notifications` un rând cu titlu "Ai primit o recenzie nouă" și descriere care conține numele produsului. ✅
- `createUserReview` (în `reviewsApi.ts`) apelează același edge function, dar **fără context de produs / închiriere**, deci notificarea nu spune pentru ce e review-ul. ⚠️
- Edge function-ul tratează un singur titlu generic ("Ai primit o recenzie nouă") indiferent de tip.

## Schimbări propuse

### 1. `LeaveReviewDialog.tsx`
- La apelul `createUserReview`, transmitem și `product_title` (deja disponibil în `rental.product_title`) ca al patrulea parametru opțional, ca să ajungă în notificare.

### 2. `src/features/profile/reviewsApi.ts`
- `createUserReview` primește un nou parametru opțional `productTitle?: string` și îl pasează în body-ul invocării `send-general-notification` (`product_title`).

### 3. `supabase/functions/send-general-notification/index.ts` (handler `review_received`)
- Schimbăm titlul notificării și subiectul email-ului ca să fie clar pentru ce produs:
  - `title_ro` → `Ai primit un review pentru "{product_title}"` (fallback fără produs: "Ai primit un review nou")
  - `title_en` → `You received a review for "{product_title}"`
- Descrierea rămâne (rating + reviewer).
- Subject email actualizat la fel.
- Link-ul rămâne `/recenzii`.

### Fără modificări de schemă
Tabela `notifications` și RLS rămân identice; doar conținutul textual și payload-ul se schimbă. Edge function se redeployează automat.

## Verificare
- Trimit un review de produs din `LeaveReviewDialog` → destinatarul vede notificare cu titlu "Ai primit un review pentru …".
- Trimit review de utilizator → la fel, cu numele produsului din închiriere.
- Verific clopotul (`NotificationBell` / `useNotifications`) — realtime e deja configurat, deci apare instant.
