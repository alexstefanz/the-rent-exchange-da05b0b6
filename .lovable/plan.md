## Scop

Simplifică `LeaveReviewDialog` la un singur review pentru tranzacție: o singură evaluare (1–5 stele) cu titlu "Rate this transaction" / "Evaluează această tranzacție" și un singur textarea "Optional comment".

## Modificări UI (`src/components/dashboard/LeaveReviewDialog.tsx`)

- Înlocuiesc cele 2 secțiuni (`About the product` cu 3 criterii + `About <user>`) cu **o singură secțiune** care conține:
  - Titlu: `Evaluează această tranzacție` / `Rate this transaction`
  - Subtitlu mic cu numele produsului + numele celuilalt utilizator (context discret).
  - Un singur `StarPicker` (1–5).
  - Un `Textarea` "Comentariu opțional" / "Optional comment" (max 500).
- State: păstrez doar `rating` și `comment`. Elimin `condition`, `communication`, `punctuality`, `userRating`, `userComment`, `productComment`.
- `canSubmit = rating > 0 && !submitting && !loading && !(productReviewExists && userReviewExists)`.

## Modificări logică submit (același fișier)

Pentru a păstra schema existentă (statistici produs + utilizator nu se strică), o singură valoare se replică automat:

- Dacă lipsește review-ul de produs și există `rental.product_id`:
  - `createProductReview(product_id, reviewType, { condition: rating, communication: rating, punctuality: rating }, comment, rental.id)`.
- Dacă lipsește review-ul de utilizator și există `rental.counterparty_id`:
  - `createUserReview(counterparty_id, rating, comment || undefined, product_title, rental.id)`.
- Restul fluxului (toast, invalidate queries, snooze/skip) rămâne neschimbat.

## Out of scope

- Nu modific schema DB (`product_reviews` / `user_reviews`), nici API-urile de scriere.
- Nu modific afișarea recenziilor existente pe pagina produsului/profilului.
- Nu modific multi-criteria pe `ProductReviewsSection` (continuă să afișeze mediile primite din DB, care vor fi identice acum că toate 3 = rating).