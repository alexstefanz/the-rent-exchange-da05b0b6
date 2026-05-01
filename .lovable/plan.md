## ID unic pentru rezervări (RNT-XXXXXX)

Fiecare rezervare va primi automat un cod public scurt și ușor de citit, în formatul **RNT-000123**, similar cu ce avem deja pentru tichete (TCK-) și KYC (KYC-). Acest cod va fi vizibil în Admin → Rezervări, poate fi copiat cu un click și folosit în filtre/căutare sau referit de chatbot.

### Ce vede adminul
- O coloană nouă **„ID Rezervare"** la începutul tabelului (ex: `RNT-000045`), monospace, cu buton de copiere lângă.
- În card-ul mobil, ID-ul apare ca prima linie deasupra titlului produsului.
- În panoul expandat (Sumar) este reluat ca element principal, alături de ID-ul intern UUID (ascuns by default, copiabil).
- Filtru text nou pe coloana ID-ului — adminul poate căuta după `RNT-000045` sau parțial `45`.
- ID-ul este menționat și în toast-urile de schimbare status: „Statusul RNT-000045 a fost actualizat…".

### Backend (migrație SQL)
1. **Coloană nouă** `public_id text NOT NULL DEFAULT 'RNT-000000'` pe `rentals` + `UNIQUE INDEX`.
2. **Sequence** `rental_public_id_seq` (start 1).
3. **Trigger** `BEFORE INSERT` care generează `RNT-` + `lpad(nextval, 6, '0')` — identic ca pattern-ul folosit la `ops_tickets` și `kyc_cases`.
4. **Backfill**: toate rezervările existente primesc retroactiv un `public_id` ordonat după `created_at` (cele mai vechi primele).
5. Update RPC `get_admin_rentals` ca să returneze `public_id`.
6. (Opțional util pentru chatbot) RPC mic `get_rental_by_public_id(text)` care întoarce rezervarea pentru admin sau participant — util ulterior, dar îl includ acum ca să poată fi apelat din suport.

### Frontend
- `src/integrations/supabase/types.ts` se regenerează automat după migrație.
- `src/pages/admin/AdminReservations.tsx`:
  - coloană nouă + filtru text pe `public_id`,
  - mobile card cu ID-ul vizibil,
  - panou expandat cu ID + buton copy (folosind `navigator.clipboard`),
  - toast-uri actualizate să includă ID-ul.
- `src/components/admin/RentalPaymentStatus.tsx` și `AdminDashboard` (recent rentals) — afișez `public_id` în loc de fragmente UUID acolo unde apar acum.

### Detalii tehnice
- Format: `RNT-` + 6 cifre cu padding (până la 999.999 rezervări fără schimbare de format).
- Trigger SECURITY DEFINER `SET search_path = public`, identic cu cele existente — fără riscuri RLS noi.
- Migrația rulează backfill într-un singur `UPDATE ... FROM (SELECT id, row_number() OVER (ORDER BY created_at))` ca să fie deterministă și rapidă.
- RLS pe `rentals` rămâne neschimbat — `public_id` nu schimbă cine vede ce.

### Confirmare scurtă
Mergem cu **format `RNT-XXXXXX`**? Dacă vrei alt prefix (ex: `RES-`, `BK-`) sau mai multe cifre, spune-mi înainte să implementez. Altfel aprobă și execut.