

## Plan: Pagini dedicate pentru Cereri, Rezervări și Anunțuri

Urmând exact pattern-ul existent de la `/favorite`, `/castiguri`, `/recenzii`, `/notificari`, voi crea 3 pagini dedicate noi. Pagina "Detalii cont" rămâne pe `/profile` deoarece este tab-ul principal.

### Fișiere noi (3 pagini)

1. **`src/pages/RequestsPage.tsx`** — pagină dedicată pentru Cereri
   - Back button → `/profile`
   - Titlu "Cereri" / "Requests"
   - Render `<RequestsTab />`
   - Structură identică cu `FavoritesPage.tsx`

2. **`src/pages/RentalsPage.tsx`** — pagină dedicată pentru Rezervări
   - Back button → `/profile`
   - Titlu "Rezervări" / "Reservations"
   - Render `<RentalsTab />`

3. **`src/pages/ListingsPage.tsx`** — pagină dedicată pentru Anunțuri
   - Back button → `/profile`
   - Titlu "Anunțuri" / "Listings"
   - Render `<LendingsTab />`

### Fișiere modificate

4. **`src/App.tsx`** — adaug 3 rute noi:
   - `/cereri` → `RequestsPage`
   - `/rezervari` → `RentalsPage` (actualizez redirect-ul existent)
   - `/anunturi` → `ListingsPage`

5. **`src/pages/Profile.tsx`** — transform butoanele portocalii din tab-uri în linkuri (`<Link>`) către paginile dedicate:
   - "Detalii cont" → rămâne pe `/profile` (content inline)
   - "Cereri" → navigare la `/cereri`
   - "Rezervări" → navigare la `/rezervari`
   - "Anunțuri" → navigare la `/anunturi`
   - Elimin `TabsContent` pentru cereri/inchirieri/anunturi și păstrez doar contul

### Detalii tehnice
- Fiecare pagină nouă: auth guard, Navbar, Footer, back button, titlu, componentă tab existentă
- Badge-ul de pending count pe "Cereri" se mută pe linkul din Profile
- Pattern identic cu cele 4 pagini dedicate existente

