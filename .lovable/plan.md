## Obiectiv
Permite rezervarea pentru o singură zi (până acum minimul era 2 zile).

## Context
Validarea minimă "2 zile" există doar în frontend, în 3 locuri. Backend-ul (Stripe checkout, RPC-uri, edge functions) nu impune un minim, așa că modificarea e strict frontend.

## Modificări

### 1. `src/pages/ProductDetail.tsx` (linia 146-149)
Schimbă condiția `differenceInDays(date, startDate) < 1` în `< 0` astfel încât selectarea aceleiași date ca start + end să producă 1 zi de închiriere. Actualizează textul toast-ului (sau elimină-l, devine doar pentru date inversate — care oricum sunt deja gestionate de `isBefore`).

### 2. `src/components/product/BookingCard.tsx` (linia 55-58)
Aceeași modificare: `< 1` → `< 0`, scoate mesajul "minim 2 zile".

### 3. Calendar — selectare aceeași zi
În ambele fișiere, branch-ul curent `if (!startDate || (startDate && endDate)) { setStartDate(date); setEndDate(undefined); }` resetează când re-clichezi pe aceeași zi. Adaugă o ramură explicită: dacă `startDate` e setat, `!endDate` și data e egală cu `startDate`, setează `endDate = startDate` (rezervare 1 zi).

### 4. Texte uxCopy / publish
- `src/components/publish/LivePreviewCard.tsx` (linia 90): condiția `data.min_rental_days > 1` rămâne corectă (afișează doar dacă owner-ul cere min > 1 zi).
- `PublishWizard` deja permite `min_rental_days = 1` ca default — nicio modificare.

## Detalii tehnice
- `rentalDays = differenceInDays(end, start) + 1` rămâne valid: `start === end` → 1 zi.
- `computeRentalPrice(1, ...)` în `src/lib/rentalPricing.ts` deja calculează corect 1 × tarif zilnic.
- `useBookedDates` / RPC `get_booked_dates` nu necesită modificări.
- Nicio migrație DB necesară.

## Verificare
- Pe pagina produs: click pe o zi liberă → click din nou pe aceeași zi → afișează 1 zi, preț = tarif zilnic, butonul Rezervă activ.
- Click start apoi end pe zi diferită → comportament neschimbat.
- Checkout-ul primește corect 1 zi și creează sesiunea Stripe.
