## Filtru limbaj licențios în review-uri

### Scop
Blocarea limbajului licențios atât în `product_reviews` cât și în `user_reviews`, pe 3 niveluri: client UI, API client și bază de date.

### 1. Extindere listă cuvinte restrictionate
Adaugă în `src/lib/profanityFilter.ts` și în triggerul DB cuvintele: `mata`, `ma-ta`, `matii`.

### 2. Validare client-side în formularul de review
În `src/components/dashboard/LeaveReviewDialog.tsx`:
- Verifică textul comentariului cu `containsProfanity()` înainte de submit.
- Afișează eroare bilingvă sub textarea dacă e detectat: "Comentariul conține limbaj inadecvat." / "Comment contains inappropriate language."
- Dezactivează butonul "Trimite review" până la corectare.

### 3. Validare API client
În `src/features/products/productReviewsApi.ts` și `src/features/profile/reviewsApi.ts`:
- Rulează `containsProfanity(comment)` înainte de `insert`. Aruncă eroare explicită dacă e detectat.

### 4. Trigger bază de date
Crează 2 triggers similare cu `check_message_profanity`, pentru tabelele `product_reviews` și `user_reviews`, pe coloana `comment`.
- Reutilizează funcția existentă `public.normalize_for_profanity()`.
- Adaugă și cuvintele noi (`mata`, `ma-ta`, `matii`) în array-ul de cuvinte din trigger.

### 5. Fallback admin
Review-urile blocate de trigger vor genera o eroare clară la submit, prinsă în UI și afișată ca toast.

### Fișiere modificate
- `src/lib/profanityFilter.ts` — adăugare cuvinte noi
- `src/components/dashboard/LeaveReviewDialog.tsx` — validare client + UI eroare
- `src/features/products/productReviewsApi.ts` — validare API
- `src/features/profile/reviewsApi.ts` — validare API
- `supabase/migrations/` — trigger(e) noi pentru `product_reviews` și `user_reviews`
