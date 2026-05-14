## Formatare preț pe pagina de produs (max 1 zecimală)

În cardul de rezervare apar valori cu multe zecimale (ex: `3.1500000000000004 RON`) din cauza erorilor de virgulă mobilă în JS. Vrem afișare cu **maxim 1 zecimală**, iar dacă zecimala ar fi `0` (ex: `5.0`) afișăm fără ea (`5`).

### Helper nou
Adaug în `src/lib/utils.ts` o funcție:

```ts
export function formatPriceShort(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10) / 10;       // max 1 zecimală
  return rounded.toFixed(1).replace(/\.0$/, "");     // elimină ".0"
}
```

Comportament:
- `1.05` → `"1.1"`
- `3.1500000000000004` → `"3.2"`
- `5` → `"5"`
- `5.0` → `"5"`
- `12.4` → `"12.4"`

### Locuri unde înlocuiesc afișarea
1. `src/components/product/PremiumBookingCard.tsx`
   - Linia ~126: `× {clientPrice} RON` → `× {formatPriceShort(clientPrice)} RON`
   - Linia ~128: `{rentalDays * clientPrice} RON` → `{formatPriceShort(rentalDays * clientPrice)} RON`
   - Linia ~130 (Total): `{totalPrice} RON` → `{formatPriceShort(totalPrice)} RON`
   - Preț pe zi din header (dacă apare cu zecimale similare) — verific și aplic acolo.
2. `src/components/product/BookingCard.tsx`
   - Linia ~121: `{clientPrice} RON` → `{formatPriceShort(clientPrice)} RON`
   - Linia ~164 (Total): `{totalPrice} RON` → `{formatPriceShort(totalPrice)} RON`

### Ce NU se schimbă
- Logica de calcul a prețului rămâne neatinsă; doar reprezentarea vizuală.
- Checkout-ul, facturile și e-mailurile (acolo se folosește deja formatarea cu 2 zecimale, conformă fiscal).

Confirmi și aplic?