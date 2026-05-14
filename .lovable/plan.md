## Goal
Permite proprietarului să seteze **durata minimă** și **durata maximă** de închiriere pentru fiecare produs, afișează vizibil pe pagina produsului și impune limitele la calcul/selectare interval în checkout. Platforma nu impune valori implicite — doar le respectă pe cele setate de owner.

## 1. DB — adaugă `max_rental_days`
Migrație nouă:
- `ALTER TABLE public.products ADD COLUMN max_rental_days integer NULL;`
- Constraint check: `CHECK (max_rental_days IS NULL OR max_rental_days >= COALESCE(min_rental_days, 1))`.
- `min_rental_days` rămâne așa cum e (default 1, nullable). Nu modificăm date existente.

## 2. Tipuri & API produse
- `src/lib/publishTypes.ts`: adaug `max_rental_days: number | null` în `PublishData` + `DEFAULT_PUBLISH_DATA.max_rental_days = null`.
- `src/features/products/productsApi.ts`: adaug `max_rental_days?: number | null` în interfețele `Product` și `ProductInput`; mapăm în `createProduct`/`updateProduct` și returnăm în `getProduct(s)`.

## 3. UI publish/edit (owner)
În pasul Detalii din `PublishWizard.tsx` (zona unde există deja `min_rental_preset` + `min_rental_days`):
- Reorganizez într-un card „Durata de închiriere":
  - **Minim (zile)** — input number, min 1, default 1.
  - **Maxim (zile)** — input number opțional (placeholder „Fără limită"), min = valoarea curentă a minimului.
- Validare client: dacă max < min → toast eroare, blochez Next.
- Update `LivePreviewCard` să afișeze și max când există: „min. 2 zile · max. 30 zile".

## 4. Afișare pe pagina produsului
- `src/pages/ProductDetail.tsx` (sau cardul de booking sticky asociat): adaug o linie informativă vizibilă pentru toți vizitatorii, sub preț:
  - Dacă doar `min_rental_days > 1`: „Închiriere minimă: X zile".
  - Dacă există și `max_rental_days`: „Durată: X – Y zile".
  - Dacă doar `max_rental_days`: „Închiriere maximă: Y zile".
  - Localizare RO/EN prin `uxCopy.ts` (chei noi: `product.minRental`, `product.maxRental`, `product.rentalRange`).
- Adaug iconiță `CalendarRange` (Lucide) lângă text, stil consistent cu celelalte meta info.

## 5. Validare interval în booking/checkout
- În selectorul de date (calendarul din cardul de booking + `Checkout.tsx`):
  - Dacă numărul de zile selectate < `min_rental_days` → mesaj inline + dezactivez butonul „Continuă".
  - Dacă > `max_rental_days` (și e setat) → același comportament.
  - Mesaje localizate RO/EN.
- Backup server-side (defense-in-depth): în RPC-ul/edge function-ul de creare rezervare (sau direct în trigger-ul `before insert` pe `rentals` dacă există), verific `total_days` vs `products.min_rental_days`/`max_rental_days` și RAISE EXCEPTION cu cod clar (`RENTAL_DURATION_OUT_OF_RANGE`). Dacă logica de rezervare e doar client-side momentan, las nota în plan și implementez doar client + RLS-friendly check în RPC dacă există unul `create_rental`.

## 6. Admin
- `AdminProducts.tsx` edit form: adaug câmpurile `min_rental_days` + `max_rental_days` (read/write), respectând aceeași validare.

## Out of scope
- Reguli complexe gen „minim diferit în weekend/sărbători".
- Discount-uri pe durată lungă (long-term pricing).
- Refactor general al cardului de booking.

## Tech notes
- `min_rental_preset` rămâne pentru sugestii rapide („1 zi/3 zile/1 săptămână"); nu îl elimin acum — păstrăm compatibilitate cu draft-urile existente.
- `max_rental_days` e nullable → înseamnă „fără limită" și e backward-compatible cu produsele existente.
