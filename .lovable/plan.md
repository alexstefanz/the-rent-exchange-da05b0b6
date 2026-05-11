## Obiectiv

Calculul totalului trebuie să fie pur zilnic: `rentalDays × clientPrice`. Fără reduceri pentru săptămâni / luni.

## Modificări

### 1. `src/lib/rentalPricing.ts`
Simplifică `computeRentalPrice` să returneze doar zile + total:
- `total = rentalDays × clientPrice`
- `months = 0`, `weeks = 0`, `days = rentalDays` (păstrează câmpurile pentru compatibilitate cu UI-ul existent care le citește)

### 2. `src/components/product/PremiumBookingCard.tsx`
În breakdown-ul afișat sub calendar:
- Elimină rândurile `breakdown.months × 30 zile × priceMonth` și `breakdown.weeks × 7 zile × priceWeek`
- Păstrează un singur rând: `{rentalDays} zile × {clientPrice} RON = {total} RON`
- `Total` rămâne afișat la fel (acum egal cu `15 × 120 = 1800 RON`)

### 3. `src/components/product/BookingCard.tsx` (varianta secundară)
- Înlocuiește calculul inline `months * priceMonth + weeks * priceWeek + extraDays * clientPrice` cu `rentalDays * clientPrice`
- Elimină linia `{priceWeek} RON / săpt · {priceMonth} RON / lună` de sub preț (nu mai e relevantă)

### 4. `src/pages/ProductDetail.tsx`
- `priceWeek` și `priceMonth` nu mai sunt folosite în calcul, dar sunt încă pasate către componente. Le pot lăsa (zero impact) sau le pot elimina împreună cu propsurile aferente. **Recomand să le elimin** din `PremiumBookingCard`, `BookingCard`, `MobileStickyBookingBar` props pentru curățenie.

### 5. Checkout (`Checkout.tsx`, `PremiumBookingSummary.tsx`)
Niciun calcul propriu — primește `totalPrice` din state-ul navigării. Va reflecta automat noua valoare. Linia `{product.price} RON × {rentalDays} zile` deja reflectă corect noul model.

## Verificare
- 15 zile × 120 RON = **1800 RON** afișat în breakdown, total card produs și pe pagina de checkout.
- 1 zi × 120 RON = 120 RON.
- 30 zile × 120 RON = 3600 RON (fără mai vechiul discount lunar).
