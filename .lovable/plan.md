

## Pagini dedicate pentru cardurile din dashboard

### Problema
Cardurile din dashboard (Favorite, Mesaje, Câștiguri, Recenzii, Notificări) navighează prin hash pe aceeași pagină `/profile`. Pe mobil, utilizatorul trebuie să dea scroll manual în jos pentru a vedea conținutul — experiență proastă.

### Soluție
Creez 5 pagini dedicate, fiecare cu Navbar + Footer + conținut complet. Cardurile din BalanceCard vor naviga la rute proprii în loc de hash-uri.

### Pagini noi (în `src/pages/`)

| Pagină | Rută | Component reutilizat |
|--------|------|---------------------|
| `FavoritesPage.tsx` | `/favorite` | `<FavoritesTab />` |
| `MessagesPage.tsx` | `/mesaje` | `<MessagesTab />` (deja există pagina Messages) |
| `EarningsPage.tsx` | `/castiguri` | `<EarningsTab />` |
| `ReviewsPage.tsx` | `/recenzii` | `<ReviewsTab />` |
| `NotificationsPage.tsx` | `/notificari` | `<NotificationsTab />` |

**Notă:** `/mesaje` deja există ca rută cu pagina `Messages`. Deci doar 4 pagini noi de creat.

### Modificări

1. **4 pagini noi** (`FavoritesPage`, `EarningsPage`, `ReviewsPage`, `NotificationsPage`) — fiecare cu layout simplu: Navbar, titlu, componenta tab existentă, Footer. Protejate cu auth redirect.

2. **`src/App.tsx`** — actualizare rute:
   - `/favorite` → `<FavoritesPage />` (înlocuiește `Navigate to /profile#favorite`)
   - `/castiguri` → `<EarningsPage />`
   - `/recenzii` → `<ReviewsPage />`
   - `/notificari` → `<NotificationsPage />`
   - `/mesaje` rămâne cum e

3. **`src/components/profile/BalanceCard.tsx`** — schimb navigarea:
   - `navigate("#castiguri")` → `navigate("/castiguri")`
   - `navigate("#favorite")` → `navigate("/favorite")`
   - `navigate("#mesaje")` → `navigate("/mesaje")` (deja funcționează)
   - `navigate("#recenzii")` → `navigate("/recenzii")`
   - `navigate("#notificari")` → `navigate("/notificari")`

4. **`src/pages/Profile.tsx`** — șterg `TabsContent` pentru favorite, mesaje, castiguri, recenzii, notificari + curăț importurile și `ALL_TAB_IDS`.

