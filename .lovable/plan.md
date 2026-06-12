## Problema
La click pe "Rezervă acum" în pagina produsului, totalul afișat în checkout este greșit (comision dublu):

- Pagina produs: `2 × 2 zile = 4 RON`, comision `1 RON`, total `5 RON` ✅
- Checkout: `2 RON × 2 zile = 5 RON` (greșit), comision `1 RON`, total `6 RON` ❌

## Cauza
În `src/pages/ProductDetail.tsx` (linia 241–242), la navigarea către `/checkout`, se trimite:

```ts
const totalPrice = computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth, product.platform_fee_percent ?? 0).total;
navigate('/checkout', { state: { ..., totalPrice } });
```

`.total` include deja comisionul. Dar `Checkout.tsx` (liniile 71–74) și `PremiumBookingSummary.tsx` (liniile 26–28) tratează `totalPrice` ca **subtotal owner-net** și mai adaugă comisionul o dată:

```ts
const platformFee = calcPlatformFee(totalPrice, product.platformFeePercent ?? 0);
const clientTotal = Math.round((totalPrice + platformFee) * 100) / 100;
```

De aceea apare `5 RON × 2 zile = 5 RON` + `1 RON comision` = `6 RON` în loc de `5 RON`.

## Fix
Schimb un singur loc în `src/pages/ProductDetail.tsx`: trimit `.subtotal` (owner-net) în loc de `.total`, păstrând contractul existent al paginii Checkout și al `PremiumBookingSummary` (care presupun owner-net și calculează comisionul singure).

```ts
const totalPrice = computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth, product.platform_fee_percent ?? 0).subtotal;
```

Verific de asemenea că `MobileStickyBookingBar` și orice alt loc care navighează la `/checkout` trimit subtotalul, nu totalul cu comision inclus (momentan `MobileStickyBookingBar` doar afișează `.total` pentru utilizator, dar nu face navigarea — confirm înainte de fix).

## Out of scope
- Nu modific `PremiumBookingCard` (afișarea pe pagina produsului este corectă).
- Nu modific `rentalPricing.ts` (formulele sunt corecte).
- Nu modific edge function-ul `create-checkout-session` (folosește valorile salvate din DB la inserarea rezervării, care provin din `subtotal` corect).
