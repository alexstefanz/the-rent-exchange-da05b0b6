## Problemă

Verificarea „ai lăsat deja review" se face per `(reviewer, product)` și per `(reviewer, reviewed_user)`, fără să țină cont de închirierea concretă. Asta blochează utilizatorul după prima recenzie, deși poate închiria același produs / același utilizator de mai multe ori. Reviewul trebuie să fie unic per **tranzacție de închiriere finalizată**.

## Plan

### 1. Schema (migrație)
- `product_reviews`: adăugăm `rental_id uuid` (nullable pentru istoric), index pe `rental_id`, și constraint unic parțial `UNIQUE (reviewer_id, rental_id, review_type) WHERE rental_id IS NOT NULL`.
- `user_reviews`: adăugăm `rental_id uuid` (nullable), index pe `rental_id`, și `UNIQUE (reviewer_id, reviewed_user_id, rental_id) WHERE rental_id IS NOT NULL`.
- Nu atingem rândurile vechi (rămân cu `rental_id NULL`) ca să nu pierdem istoric.

### 2. API-uri
- `createProductReview(productId, reviewType, ratings, comment, rentalId)` — primește și salvează `rental_id`.
- `createUserReview(reviewedUserId, rating, comment, productTitle, rentalId)` — același lucru.

### 3. UI — `LeaveReviewDialog.tsx`
- Check existent: în loc de filtru pe `product_id` / `reviewed_user_id`, filtrăm pe `rental_id = rental.id` pentru ambele recenzii.
- La submit pasăm `rental.id` în ambele apeluri.
- Mesajul „Ai lăsat deja review pentru această închiriere" rămâne corect (acum se referă strict la închirierea curentă).

### 4. Verificare
- Build trece, dialogul permite review pe a doua închiriere a aceluiași produs, iar a doua trimitere pe aceeași închiriere e blocată (UI + constraint DB).

### Detalii tehnice
- Constraint partial unique evită conflicte cu rândurile vechi fără `rental_id`.
- Nu se modifică agregările (rating mediu produs/utilizator) — continuă să citească toate review-urile.
