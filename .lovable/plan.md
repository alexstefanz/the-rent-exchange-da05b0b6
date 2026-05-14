## Obiectiv

Decongestionarea paginii `/inchirieri` (componenta `RentalsOutTab.tsx`) cu trei modificări vizuale + o acțiune nouă pentru cererile primite.

## 1. Sumar mic — 4 carduri statistici

Înlocuiesc grila `sm:grid-cols-3` cu `sm:grid-cols-2 lg:grid-cols-4`:

- **Cereri noi** — `pendingRentals.length` (icon `Inbox`)
- **Active** — confirmed + active (icon `Package`)
- **Anulate** — `rentals.filter(r => r.status === "cancelled").length` (icon `XCircle`, accent muted)
- **Câștig luna asta** — neschimbat, valoarea în `text-primary`

Stiluri identice cu cele actuale (rounded-xl, border, bg-card, p-4).

## 2. Card premium pentru "Cereri de închiriere"

Mutat ca **prima secțiune** (deasupra sumarului? — nu, sumarul rămâne sus, dar pending devine vizual cel mai proeminent prin design). Redesign:

- Container: `rounded-2xl` cu gradient subtil `bg-gradient-to-br from-primary/10 via-primary/5 to-card`, `border-2 border-primary/40`, `shadow-lg shadow-primary/10`, padding mai generos `p-5 sm:p-6`
- Header card: imagine mai mare (20×20), titlu produs `text-lg font-semibold`, badge "Cerere nouă" cu `bg-primary text-primary-foreground` pulsant
- Linia principală: **"Cerere de la [Nume Chiriaș]"** ca text proeminent (`text-base font-medium`)
- Grid info în 3 coloane cu iconițe: Perioadă (Calendar), Zile (Clock), **Câștig din tranzacție** (TrendingUp, valoare în `text-primary text-xl font-bold`)
- Mesaj chiriaș (dacă există) — păstrat în bubble
- Butoane: `Acceptă` (gradient primary), `Refuză` (outline)
- **Buton nou suplimentar**: `Solicită anularea cererii` (variant `ghost` cu text muted, dimensiune mică, sub butoanele principale) — vizibil DOAR după acceptare (status `confirmed` sau `active`) și **înainte de semnarea primului PV** (`handover_confirmed_at == null`). Pentru status `pending`, butonul nu are sens (refuzul rezolvă cazul).

  Notă: În realitate, "Solicită anularea cererii" pentru un rental confirmat folosește fluxul existent `requestMutualCancellation` (RPC + edge function `mutual-cancel-rental`) deja folosit în `MutualCancellationCard`. Pentru a respecta cerința user-ului fără a duplica logică, **mutăm cererile confirmate dar fără PV semnat în aceeași secțiune premium "Cereri active"** sau adăugăm butonul direct pe cardul pending după ce devine confirmat. Decizia: extindem secțiunea premium să afișeze și rezervările `confirmed` fără PV (acolo apare butonul de anulare), iar `pending` păstrează doar Acceptă/Refuză.

## 3. Istoric în accordion fără imagini

Secțiunea "Închirieri active & istoric" devine accordion (`@/components/ui/accordion`):

- Trigger: titlu "Închirieri active & istoric" + counter `(N)`, default închis
- Content: listă verticală fără imagini. Fiecare rând:
  - Stânga: nume produs (font-medium) + chiriaș/proprietar (text-sm muted) + perioadă (text-xs muted)
  - Dreapta: preț (`owner_payout RON`) + StatusBadge + buton `Vezi mai mult` (variant outline, size sm) → link la `/inchirieri/{public_id}`
- Layout `flex items-center justify-between` cu `border-b` între rânduri, `py-3`
- Pe mobile, devine stack vertical cu butonul full-width

Excludere: rezervările deja afișate în secțiunea premium (confirmed fără PV) nu se dublează în istoric.

## Fișiere modificate

- `src/components/dashboard/RentalsOutTab.tsx` — toate modificările de mai sus

## Detalii tehnice

- Pentru cancel button: import `requestMutualCancellation` din `@/features/rentals/rentalsApi`, dialog confirmare cu textarea pentru motiv (similar cu rejectDialog), invalidate `["ownerRentals"]` la succes
- Filtrul pentru "fără PV semnat": `r.handover_confirmed_at == null` — câmpul există deja în `OwnerRental` (verific la implementare)
- Accordion: `<Accordion type="single" collapsible>` cu un singur item

## Out of scope

- Schimbări de business logic / DB
- Refactorizarea componentei `RentalProductCard` (rămâne folosită altundeva)
- Modificări la `/inchirieri/{id}` page