## Evidențiere cereri noi pe tabul „Cereri primite"

### Problemă
- `stats.new_requests` (cereri în status `pending`) e deja calculat de `get_owner_listings_stats` și disponibil în `ListingsPage`.
- Tabul de sus „Cereri primite" nu îl arată — userul nu vede că are cereri noi decât dacă schimbă tab-ul.
- Există deja popup-ul global de cerere nouă (mem rental-request-popup), dar tabul însuși rămâne mut.

### Modificări (doar `src/pages/ListingsPage.tsx`)

1. **Badge pe tabul „Cereri primite"** (lângă iconul Inbox):
   - Când `stats.new_requests > 0`: badge rotund primary (`bg-primary text-primary-foreground`) cu numărul (sau `9+` peste 9).
   - Când `= 0`: fără badge.
   - Adaug un mic `dot` pulsatil (`animate-pulse`) pe tabul inactiv ca semnal periferic.

2. **Realtime invalidation pentru cereri**:
   - Canalul realtime existent ascultă doar `products`. Adaug un al doilea subscribe pe `rentals` filtrat după `owner_id=eq.${user.id}` care invalidează `owner-listings-stats` la INSERT/UPDATE.
   - Astfel badge-ul se actualizează instant când vine o cerere nouă, fără refresh manual.

3. **Sincronizare cu butonul „Cereri noi" din filtre**:
   - Păstrez butonul existent, dar îi adaug același styling primary când `new_requests > 0` (ring/border primary + text primary), ca să fie vizibil.

### Tehnic
- Tabs din shadcn permit children în `TabsTrigger`; badge-ul intră în același flex `gap-2`.
- Nimic în logica de date sau RLS nu se schimbă — doar prezentare + un canal realtime în plus.

### Fișiere
- `src/pages/ListingsPage.tsx` — badge pe tab + realtime pe `rentals` + accent pe butonul „Cereri noi".

Nu schimb nimic în `RentalsOutTab` sau în RPC.
