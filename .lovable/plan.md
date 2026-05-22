# /anunturi — filtre ca dropdown + grid 2 pe rând

## Schimbări

### 1. Filtrele de status → Dropdown
Înlocuiesc `Tabs/TabsList` cu cele 6 opțiuni (Toate, Active, În verificare, Ascunse, Respinse, Cereri noi) cu un `Select` (shadcn). Fiecare opțiune păstrează badge-ul cu numărul. „Cereri noi" rămâne separată: când e selectată, comută `topTab` la `cereri` (același comportament ca acum).

Layout: dropdown-ul stă pe rând cu `ListingsFilterBar` (sau imediat deasupra), aliniat la stânga, lățime ~220px pe desktop, full width pe mobile.

### 2. „Produsele mele" — 2 pe rând
Grid-ul curent: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
Modific la: `grid gap-4 grid-cols-2` (2 coloane pe toate breakpoint-urile, inclusiv mobile, conform cererii).

## Fișier modificat
- `src/pages/ListingsPage.tsx`

## Verificare
- /anunturi pe mobile (390px): dropdown vizibil, 2 carduri pe rând.
- Selectare „Cereri noi" → comută pe tab-ul „Cereri primite".
- Badge-urile rămân vizibile în dropdown.
