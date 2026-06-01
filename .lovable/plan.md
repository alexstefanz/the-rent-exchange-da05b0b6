# Disponibilitate anunț — mutually exclusive + dată custom

## Probleme
1. În popup-ul „Disponibilitate" se pot bifa și „Disponibil imediat" și zile blocate în același timp (UX confuz).
2. Nu există opțiunea „Disponibil începând cu o anumită dată" — utilizatorii nu pot programa o dată de start (anterioară sau ulterioară datei publicării).

## Modificări

### 1. DB — coloană nouă
Adaug `available_from date` în `public.products` (nullable, fără constrângere față de `created_at`). Actualizez și view-urile/RPC-urile care expun câmpurile produsului:
- `products_public` view & `get_safe_product` (din migrațiile 20260528*) — adaug `available_from`.

### 2. Dialog `ListingAvailabilityDialog`
Redesign cu **două opțiuni mutually exclusive** (RadioGroup, două carduri):
- **„Disponibil imediat"** — apare în căutări de la momentul publicării.
- **„Disponibil începând cu data"** — afișează un date-picker (Calendar mode="single"). Acceptă orice dată (inclusiv anterior datei publicării). Sub aceasta apare descrierea „Apare în căutări începând cu această dată".

„Zile blocate" (calendar multiple) rămâne sub ambele opțiuni — perioade indisponibile separate.

Salvare:
- opțiunea „imediat" → `available_immediately=true, available_from=null`
- opțiunea „de la data" → `available_immediately=false, available_from=<ISO date>`

### 3. Tipuri & API
- Adaug `available_from?: string | null` în `Product` (`src/features/products/productsApi.ts`) și includ în `PRODUCT_SAFE_COLS`.
- `src/lib/publishTypes.ts` — adaug câmpul în tipuri (default `null`).

## Scope-out
Nu modific filtrarea în search / `get_booked_dates` / card listing badge (UX-ul existent rămâne). Doar persistăm valoarea; eventuale ajustări vizuale se pot adresa separat.
