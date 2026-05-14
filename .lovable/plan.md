## Două modificări mici

### 1. Scoatem temporar "Durata de închiriere" din wizardul de publicare

În `src/components/publish/PublishWizard.tsx`:
- În `Step5Pricing` elimin blocul `Rental duration limits` (cardul cu "Durata de închiriere", `min_rental_days` / `max_rental_days`).
- În `validateStep`, elimin verificarea `s === 4 && data.max_rental_days != null && ...`.
- În `Step6Review`, elimin `ReviewRow` pentru "Durată închiriere".
- **Păstrez** câmpurile `min_rental_days` / `max_rental_days` în `PublishFormData`, în payload-ul de save și în defaults (`min_rental_days: 1`, `max_rental_days: null`) — astfel datele existente rămân intacte și putem reactiva UI-ul în viitor fără migrări.

### 2. `LocationCard` — adresa exactă, fără disclaimer

În `src/components/product/LocationCard.tsx`:
- Afișez adresa completă: `{address || city}` (folosim `pickup_address` din produs, deja transmis ca prop `address`).
- Elimin rândul cu `Lock` + textul "Adresa exactă apare după rezervarea confirmată." (și varianta EN).
- Folosesc `address` (cu fallback la `city`) și pentru query-ul iframe-ului Google Maps, pentru a pinui adresa exactă.
- Dacă `address` lipsește, fallback grațios pe `city` (ca acum).

### Out of scope
- Fără modificări la DB, RLS, RPC sau la `pickup_address` (deja există și e populat din wizard).
- Fără modificări la flow-ul de gated contact / pickup pentru chiriași — schimbarea e doar la afișarea publică din `LocationCard`.
