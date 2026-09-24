# Blocarea limbajului licențios la review-uri

## Stare actuală

- Există deja un filtru de limbaj (`src/lib/profanityFilter.ts`, listă RO+EN, cu normalizare diacritice și leetspeak) și o funcție similară în baza de date (`check_message_profanity`, folosită la chat).
- Review-urile (`product_reviews` și `user_reviews`) verifică deja comentariul înainte de trimitere, dar **doar în pagină** — verificarea poate fi ocolită printr-un apel direct către baza de date.
- În plus, review-urile folosesc varianta „strictă" a filtrului, care poate respinge greșit cuvinte nevinovate (ex. „automată" conține „mata").

## Ce fac

1. **Verificare în baza de date (nu doar în pagină)** — adaug un trigger pe tabelele `product_reviews` și `user_reviews` care respinge insertul/update-ul dacă comentariul conține limbaj licențios, folosind aceeași listă ca la chat. Astfel regula nu mai poate fi ocolită.
2. **Aliniere cu varianta „pe cuvinte"** — la review-uri folosesc verificarea pe cuvinte întregi (`containsProfanityWords`), ca la tichete, pentru a evita respingerile greșite ale cuvintelor nevinovate; insultele compuse/ofuscate rămân prinse.
3. **Mesaj clar utilizatorului** — la respingere, utilizatorul vede mesajul existent: „Comentariul conține limbaj inadecvat. Te rugăm să-l reformulezi."

## Detalii tehnice

- Migrație nouă: `CREATE TRIGGER` pe `product_reviews` și `user_reviews` (BEFORE INSERT OR UPDATE OF comment) care apelează funcția de profanitate existentă din DB și ridică excepție la potrivire.
- `src/features/products/productReviewsApi.ts` și `src/features/profile/reviewsApi.ts`: `containsProfanity` → `containsProfanityWords`.
- Verificare: test cu un comentariu licențios (respins) și unul nevinovat cu „automată" (acceptat), apoi `bun run tsgo --noEmit`.
