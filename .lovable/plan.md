## Problema
Eticheta "23 RON / lună" e ambiguă pentru că lunile au 28–31 de zile, dar tarifarea folosește exact 30 de zile. Schimbăm eticheta în "30 zile" / "30 days" pentru claritate.

## Modificări

### 1. `src/data/uxCopy.ts`
- `productDetail.month`: schimb din `{ ro: "lună", en: "month" }` în `{ ro: "30 zile", en: "30 days" }`.
- Astfel se actualizează automat afișarea principală a prețului din BookingCard și ProductDetail (`23 RON / 30 zile`).

### 2. `src/components/product/BookingCard.tsx` (breakdown la rezervare)
În descompunerea prețului unde se afișează "1 lună × ..." / "2 luni × ...":
- RO: în loc de `lună / luni` → `30 zile` (singular și plural identic, mai clar).
- EN: în loc de `month / months` → `30 days`.
- Exemplu: `2 × 30 zile × 23 RON = 46 RON` în loc de `2 luni × 23 RON`.

### 3. `src/pages/ProductDetail.tsx` (același breakdown)
- Aplic exact aceeași schimbare ca la BookingCard în secțiunea `priceBreakdown.months > 0`.

## Ce NU se schimbă
- Logica de calcul rămâne neatinsă (1 "lună" = 30 zile, deja așa era).
- Câmpul `priceMonth` din DB rămâne neschimbat.
- Calendarul, header-ul preț/zi, săptămâna și restul UI-ului sunt neatinse.

## Rezultat vizual
- Card preț: `23 RON / 30 zile`
- Breakdown: `2 × 30 zile × 23 RON   46 RON`
