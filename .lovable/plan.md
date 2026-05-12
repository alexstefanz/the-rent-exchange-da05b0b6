## Schimbare

În `src/components/messaging/TransactionCard.tsx`, butonul „Vezi detalii rezervare" duce momentan către lista `/inchirieri` sau `/rezervari`. Îl direcționăm către pagina detaliată a rezervării respective folosind `public_id` (ex: `/inchirieri/RNT-000061` pentru proprietar, `/rezervari/RNT-000061` pentru chiriaș).

### Modificări

`src/components/messaging/TransactionCard.tsx`:
- Construire link:
  - Dacă `data.publicId` există → `link = `/${data.role === "owner" ? "inchirieri" : "rezervari"}/${data.publicId}``
  - Fallback (fără publicId) → linkul rămâne către lista generală ca acum.
- Restul cardului neschimbat.

Nimic altceva nu se modifică (ruta există deja: `/inchirieri/:publicId` și `/rezervari/:publicId`).
