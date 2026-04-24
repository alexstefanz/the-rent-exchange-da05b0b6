

## Plan: Adaugă numele produsului în notificarea „Câștig adăugat în balanță"

### Problemă

Notificarea de payout pentru proprietar afișează doar suma:
> „Ai primit 2 RON din închiriere."

Proprietarul nu știe **de la ce produs** provin banii. Util mai ales când are mai multe anunțuri active.

### Soluție

Modific trigger-ul `notify_user_payout()` din baza de date să facă lookup pe `rentals` → `products` plecând de la `NEW.rental_id` și să includă titlul produsului în descriere.

**Format nou:**
- RO: „Ai primit 2 RON pentru închirierea „Laptop gaming"."
- EN: „You received 2 RON for the rental of „Laptop gaming"."

Dacă produsul a fost între timp șters sau `rental_id` lipsește (caz rar), revin la textul generic actual ca fallback.

### Modificări

**Migrație SQL nouă:** `CREATE OR REPLACE FUNCTION public.notify_user_payout()` cu:
- `SELECT p.title INTO v_product_title FROM rentals r JOIN products p ON p.id = r.product_id WHERE r.id = NEW.rental_id`
- Construiesc descrierea cu `v_product_title` dacă există, altfel fallback la formularea veche.
- Linkul rămâne `/castiguri`.

Linkul ar putea opțional să ducă direct la rezervarea respectivă (`/inchirieri-emise?rental={id}`), dar păstrez `/castiguri` pentru a fi consistent cu fluxul existent unde proprietarul vede balanța și sursele câștigurilor.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/migrations/<new>.sql` | Rescriu `notify_user_payout()` să includă titlul produsului din `rentals` → `products` |

### Rezultat

Notificările viitoare de tip „Câștig adăugat în balanță" vor afișa explicit numele produsului care a generat câștigul, ex.:
> „Ai primit 2 RON pentru închirierea „Laptop gaming"."

Notificările vechi rămân neschimbate (textul e stocat la momentul creării).

