## Probleme identificate

Din ecranele atașate și din cod:

1. **Totalul nu se calculează corect.** În `Sumar financiar` (rental detail) apare `Subtotal 8.4 + Comision 0.42 = Total 8.4 RON` — comisionul este afișat dar nu se adună la total. La checkout, `Total` afișează `8 RON` în loc de `8.4 RON` (`useCountUp` rotunjește la întreg).
2. **Modelul de preț este inconsistent:** `daily_price_owner = 2 RON` → client price `2.10 RON` (owner × 1.05). `subtotal = 2.10 × 4 = 8.4` (totalul clientului). Apoi `platform_fee = 5% × 8.4 = 0.42` se scade din subtotal → owner primește `7.98 RON` în loc de `8 RON` promiși în publish wizard.
3. **Prețuri cu zecimale.** Input-ul din publish wizard (`Step5Pricing`, `type="number"`) acceptă orice zecimale și produce sume urâte (2.1 RON / zi, total 8.4 RON).
4. **Fără comision minim.** La închirieri foarte mici (ex. 8 RON) comisionul de 5% înseamnă 0.42 RON, neeconomic. Trebuie minim 1 RON.

## Soluție

### 1. Unificarea modelului de preț (sursa de adevăr)

Schimbăm semnificația câmpurilor:
- `daily_price_owner` = ce primește proprietarul / zi (întreg, ≥ 2 RON).
- `subtotal` (în `rentals`) = `daily_price_owner × rental_days` (suma netă pentru proprietar).
- `platform_fee` = `max(1, round(subtotal × platform_fee_percent / 100, 2))` dacă `platform_fee_percent > 0`, altfel `0`.
- `owner_payout` = `subtotal` (proprietarul primește exact `2 RON × zile`).
- **Total client = `subtotal + platform_fee`** (ce încasează Stripe).

Avantaje: numere rotunde, owner primește exact cât a setat, comision transparent ca rând separat.

### 2. Front-end — preț întreg

`src/components/publish/PublishWizard.tsx` (`Step5Pricing`):
- `<Input type="number" min={2} step={1} inputMode="numeric" pattern="[0-9]*">`.
- `onChange`: `Math.max(0, Math.floor(Number(e.target.value)))` ca să blocheze zecimalele copy-paste.
- În blocul „Clientul plătește": afișează `subtotal + comision` calculat cu `max(1, …)`. Helper text: `+ X RON comision (Y%)` cu X = comisionul efectiv (min 1).

### 3. Helper unic pentru calcul

În `src/lib/rentalPricing.ts`:
```ts
export const MIN_PLATFORM_FEE_RON = 1;

export function calcPlatformFee(subtotalOwner: number, feePercent: number) {
  if (!feePercent || feePercent <= 0) return 0;
  const raw = Math.round(subtotalOwner * feePercent) / 100;
  return Math.max(MIN_PLATFORM_FEE_RON, Math.round(raw * 100) / 100);
}

export function calcClientTotal(subtotalOwner: number, feePercent: number) {
  return Math.round((subtotalOwner + calcPlatformFee(subtotalOwner, feePercent)) * 100) / 100;
}
```

Refactor `computeRentalPrice` să întoarcă `subtotalOwner`, `platformFee`, `total` (client). Înlocuim toate locurile care folosesc `clientPrice = owner × 1.05`:
- `src/features/products/productsApi.ts` → `calculateClientPrice` devine wrapper peste `calcClientTotal(owner × 1, feePercent)` pentru ziua singulară, dar majoritatea consumerilor (cardurile de listing, Search, CategoryDetail, UserProfile, ProductDetail hero price) afișează acum `daily_price_owner` ca preț de zi al clientului + un mic indicator `+ comision la checkout`. Notă: schimbă prețurile afișate în listă de la `2.10 RON` la `2 RON` — confirmare necesară (vezi întrebare).
- `src/pages/ProductDetail.tsx` (`handleReserve`, JSON-LD, `trackRecentlyViewed`), `src/components/product/PremiumBookingCard.tsx`, `MobileStickyBookingBar.tsx`: trec prin `computeRentalPrice` reactualizat care folosește `daily_price_owner`.

### 4. Checkout — afișare corectă

`src/components/checkout/PremiumBookingSummary.tsx`:
- Schimbă props: primește `dailyPriceOwner`, `rentalDays`, `platformFeePercent`.
- Calculează `subtotal`, `platformFee`, `total` cu helperele de mai sus.
- Rândurile: `X RON × N zile → subtotal RON`, `Comision Rentli → +platformFee RON` (nu „Gratuit") dacă > 0, altfel „Gratuit".
- `Total` folosește `Math.round(total * 100) / 100` și `useCountUp` adaptat să afișeze 2 zecimale (sau întreg dacă `total % 1 === 0`).

`src/pages/Checkout.tsx` (caller) trimite `dailyPriceOwner` și `platformFeePercent` în loc de `clientPrice`.

### 5. Crearea rentalului

`src/features/rentals/rentalsApi.ts` (`createRental`):
- `dailyPrice` primit = `daily_price_owner` (întreg).
- `subtotal = dailyPrice * rentalDays`.
- `platformFee = calcPlatformFee(subtotal, platformFeePercent)`.
- `ownerPayout = subtotal` (nu se mai scade).
- Insert: `daily_price: dailyPrice` (owner), `subtotal`, `platform_fee`, `owner_payout`.

Backend Stripe (`supabase/functions/create-checkout-session/index.ts`):
- `unit_amount = Math.round((rental.subtotal + rental.platform_fee) * 100)` (Stripe încasează totalul real).
- Verificarea minimului de 2 RON rămâne, dar pe `subtotal + platform_fee`.

`supabase/functions/capture-rental-payment/index.ts`: `owner_payout` și `platform_fee` rămân deja stocate corect — doar valorile lor sunt diferite acum.

### 6. Sumar financiar (rental detail)

`src/pages/RentalDetailPage.tsx` (~linia 714-728):
- Rândul totalului folosește `rental.subtotal + rental.platform_fee` pentru chiriaș (în loc de `rental.subtotal`).
- Pentru proprietar afișează `rental.owner_payout` (= subtotal acum).

## Compatibilitate cu datele existente

Rentalurile vechi au modelul invers (`subtotal` include comisionul). Pentru a evita confuzii la afișare:
- Adăugăm un flag derivat: tratăm `rentals` create înainte de migrație drept legacy doar la nivel de UI dacă apare `owner_payout < subtotal`. Practic, pe rental detail putem afișa mereu `subtotal + platform_fee` ca total client — pentru rentalurile vechi, acest total va apărea mai mare decât suma efectiv încasată. **Recomandare:** filtrăm vizual doar pe rentaluri noi, păstrând valorile vechi neatinse în DB.

Alternativ și mai simplu: nu retroactivăm — schimbarea afectează doar rentalurile create de aici încolo. Adăugăm `platform_fee_basis` enum (`'gross' | 'net'`) cu default `'net'` pe rentaluri noi pentru a ști cum să afișăm. Decid în implementare.

## Detalii tehnice (referință)

```text
Owner setează 10 RON/zi, 4 zile, fee 5%:
  subtotal      = 40 RON
  platform_fee  = max(1, 40 * 0.05) = max(1, 2) = 2 RON
  total client  = 42 RON
  owner payout  = 40 RON

Owner setează 5 RON/zi, 2 zile, fee 5%:
  subtotal      = 10 RON
  platform_fee  = max(1, 10 * 0.05) = max(1, 0.5) = 1 RON
  total client  = 11 RON
  owner payout  = 10 RON

Free listing (fee=0):
  platform_fee  = 0
  total client  = subtotal
  owner payout  = subtotal
```

## Întrebare de clarificare

1. **Prețul afișat în carduri / listă / hero produs** — îl arătăm acum ca preț *net owner* (ex. „2 RON / zi") cu mențiunea „+ comision la checkout", sau preferi să afișăm direct totalul (owner + comision min 1 RON) ca preț al clientului? Comisionul minim de 1 RON face afișarea per-zi ciudată (1 zi = 2+1=3 RON, 4 zile = 2×4+1=9 RON), așa că recomand afișarea netă în liste și totalul calculat doar la checkout.
