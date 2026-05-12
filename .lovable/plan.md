## Obiectiv
Simplifică paginile `/rezervari` (chiriaș) și `/inchirieri` (proprietar) astfel încât să afișeze **doar carduri de produse într-un grid**. Click pe card → navighează la pagina detaliată a închirierii (`/rezervari/RNT-XXXXXX` sau `/inchirieri/RNT-XXXXXX`), unde rămân toate funcționalitățile actuale (timeline, plată, PV, chat, etc).

## Schimbări

### 1. `src/components/dashboard/RentalsTab.tsx` (chiriaș – `/rezervari`)
Înlocuire completă a randării:
- Elimină articolele mari cu `RentalTimeline`, `MainActionCard`, `SecondaryActionsMenu`, `Collapsible`, dialogurile de inspecție/dispute/review/early-return.
- Păstrează `fetchMyRentals`, `useQuery`, `useRentalRealtime`, empty state.
- Render: grid responsiv (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`) cu carduri compacte.

Card (link `<Link to={/rezervari/${public_id}}>`):
- Imagine produs (aspect-square, `object-cover`, `rounded-xl`)
- Titlu produs (1 linie, `line-clamp-1`, `font-semibold`)
- Sub-rând: perioadă scurtă (`d MMM – d MMM`)
- `StatusBadge` în colțul imaginii (overlay top-right)
- Preț total mic în footer card
- Hover: `shadow-md`, scale subtle

Fallback dacă `public_id` lipsește: link către `/produs/{product_id}`.

### 2. `src/components/dashboard/RentalsOutTab.tsx` (proprietar – `/inchirieri`)
- **Păstrează** secțiunea „Cereri de închiriere" (pending) cu butoanele Acceptă/Refuză și dialog de refuz – aceste cereri nu au încă o pagină de detaliu „închiriere activă" și acțiunea e critică.
- **Păstrează** stats bar (Cereri noi / Active / Câștig luna).
- **Înlocuiește** secțiunea „Închirieri active & istoric" cu același grid de carduri produse, fiecare link către `/inchirieri/{public_id}`.
- Elimină din această secțiune: `RentalTimeline`, `MainActionCard`, `SecondaryActionsMenu`, `Collapsible` payment status, dialogurile (Inspection / Review / Accepted) – devin nefolosite și se șterg împreună cu state-urile asociate.
- Handler-ele `handleConfirmHandover` / `handleConfirmReturn` se elimină (acțiunile rămân pe pagina de detaliu existentă).

### 3. Card reutilizabil
Adaugă `src/components/dashboard/RentalProductCard.tsx`:
- Props: `image`, `title`, `startDate`, `endDate`, `status`, `amount`, `amountLabel` (ex. „Total" / „Câștig"), `to` (URL).
- Folosit de ambele tab-uri pentru consistență vizuală.

## Comportament
- Layout grid responsiv: 2 coloane mobile, 3 tablet, 4 desktop.
- Click oriunde pe card → navigare către pagina de detaliu (deja existentă, cu toate acțiunile).
- Pagina de detaliu (`RentalDetailPage`) rămâne nemodificată – este sursa unică pentru timeline, plată, PV, chat, dispute.

## În afara scopului
- Fără modificări la `RentalDetailPage`, edge functions, RLS, schema DB.
- Fără modificări la fluxul de plată sau notificări.
