## Goal

Afișează ID-ul public al rezervării (ex: `RNT-000077`) pe fiecare card din:
- `/inchirieri` — "Cereri primite" (owner view, `RentalsOutTab.tsx`)
- `/rezervari` — "Închirierile mele" (renter view, `RentalsTab.tsx`)

## Fix

În ambele componente, afișează `rental.public_id` într-un mic chip discret în colțul de sus al cardului (lângă badge-ul de status) și în rândurile din istoricul cu accordion.

**`src/components/dashboard/RentalsOutTab.tsx`**
- În cardurile premium (zona "Cereri de închiriere"), adaugă deasupra titlului produsului un `<span>` mic cu font-mono: `{rental.public_id}` (doar dacă există), stilizat ca chip subtil (`text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 rounded-md px-1.5 py-0.5`).
- În rândurile din accordion-ul "Închirieri active & istoric", afișează ID-ul mic sub titlul produsului.

**`src/components/dashboard/RentalsTab.tsx`** (renter)
- Aceeași abordare: chip cu `public_id` pe fiecare card / rând.

Fără modificări de date sau RPC — `public_id` e deja inclus în `OwnerRental` și în datele rentale.

## Verification

- Reload `/inchirieri` și `/rezervari` și confirmă că fiecare card afișează ID-ul (ex: `RNT-000077`).