## Probleme

1. **Status "Blocat" rămâne chiar după finalizare** — în `useEarnings.ts`, statusul tranzacției se calculează doar din `payment_status`. Dacă plata a fost făcută cu hold și rezervarea s-a încheiat (`rentals.status === "completed"`), `payment_status` rămâne `authorized`, deci tranzacția apare ca "Blocat".

2. **Drawer-ul de detalii nu afișează cu cine s-a făcut tranzacția** — `EarningsTransaction` are `renterId` dar nu fetch-uie numele/avatarul chiriașului.

3. **Butonul "Vezi rezervarea" duce la 404** — link-ul e `/rezervare/${publicId}`, dar ruta corectă pentru owner e `/inchirieri/:publicId` (în `App.tsx` există `/inchirieri/:publicId` și `/rezervari/:publicId`, nu `/rezervare/...`).

## Modificări

### 1. `src/hooks/useEarnings.ts`
- La calcul status: dacă `r.status === "completed"`, marchează tranzacția ca `available` (chiar dacă `payment_status` rămâne `authorized` în date legacy).
- Fetch suplimentar pentru profilurile chiriașilor: după ce rezultă lista de rentals, ia un `select` din `profiles` pentru toate `renter_id` distincte și populează `renterName` (și `renterAvatar` opțional) în `EarningsTransaction`.
- Extinde interfața `EarningsTransaction` cu `renterAvatar: string | null`.

### 2. `src/components/earnings/TransactionDetailDrawer.tsx`
- Adaugă o secțiune nouă "Chiriaș" / "Renter" în drawer cu avatar + nume + link către profil public (`/utilizator/${renterId}` sau ce există) — verific ruta de profil utilizator în `App.tsx` înainte.
- Schimbă `Link to={`/rezervare/${tx.rentalPublicId}`}` în `Link to={`/inchirieri/${tx.rentalPublicId}`}` (perspectiva owner).

### 3. (Opțional, dacă există) Pagina de detalii rezervare
- Confirmă că `/inchirieri/:publicId` funcționează cu `public_id` (RNT-XXXXXX). Dacă nu, ajustez.

## Out of scope

- Nu modific logica de payout/escrow în backend.
- Nu schimb badge-urile de status în alte locuri.
- Nu modific lista de tranzacții (table-ul), doar dacă badge-ul se actualizează automat din noul status.

## Fișiere

- Editat: `src/hooks/useEarnings.ts`
- Editat: `src/components/earnings/TransactionDetailDrawer.tsx`
