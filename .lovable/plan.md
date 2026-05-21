# Redesign sticky bar mobil/tabletă (booking)

## Ce schimb
Doar `src/components/product/MobileStickyBookingBar.tsx`. Restul componentelor și logica (selectare date, `onReserve`, `onAsk`, sheet cu calendarul) rămân neatinse.

## Layout nou (vizibil `<lg`)

```
┌──────────────────────────────────────────────┐
│ 21 – 22 Mai · 3 zile           17.28 RON     │
│                                  total       │
├──────────────────────────────────────────────┤
│ [Întreabă proprietarul]  [Rezervă acum]      │
└──────────────────────────────────────────────┘
```

- **Rând 1 — detalii**:
  - Stânga: interval date format `d MMM – d MMM` (locale RO/EN) + sub el "N zile / N days". Dacă nu sunt date selectate, afișează "Selectează datele".
  - Dreapta: `totalPrice RON` (calculat cu `computeRentalPrice`) + sub el "total". Dacă nu sunt date, afișează prețul/zi (`clientPrice RON / zi`).

- **Rând 2 — butoane (50/50 side-by-side)**:
  - **Stânga: "Întreabă proprietarul"** → `variant="outline"`, full-width, declanșează `onAsk`. Iconiță `MessageCircle`.
  - **Dreapta**:
    - Dacă `startDate && endDate` → buton primar `"Rezervă acum"` (RO) / `"Reserve now"` (EN), full-width, declanșează `onReserve`.
    - Altfel → buton primar `"Verifică datele"` (RO) / `"Check dates"` (EN) care deschide Sheet-ul cu `PremiumBookingCard` (logică deja existentă cu `<Sheet>`).
  - Iconiță `CalendarCheck` pentru "Verifică datele", `CheckCircle2` pentru "Rezervă acum".

- Container rămâne `fixed bottom-0 left-0 right-0 z-40 lg:hidden`, cu `bg-card/95 backdrop-blur-xl`, `border-t`, `shadow`, `paddingBottom: env(safe-area-inset-bottom)`. Padding intern: `px-4 pt-3 pb-3`, gap între rânduri `gap-2`.

- Dacă `isOwnProduct === true`, ascund butoanele de acțiune (deja se face în Sticky desktop) și păstrez doar afișajul.

## Detalii tehnice
- Reutilizez `computeRentalPrice` și `formatPriceShort` (deja folosite în `PremiumBookingCard`).
- Format date cu `date-fns` (`format(d, "d MMM", { locale })`).
- Păstrez Sheet-ul existent, doar mut declanșarea pe butonul "Verifică datele" (când nu sunt date).
- Nu modific `PremiumBookingCard`, `ProductDetail` sau alte fișiere.

## În afara scope-ului
- Nu adaug garanție/deposit (proiectul nu îl expune pe această pagină).
- Nu schimb culorile sau radius-ul (rămân semantic tokens).
- Nu modific sticky bar-ul desktop (`PremiumBookingCard`).
