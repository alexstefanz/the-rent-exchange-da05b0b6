

## Plan: Pagină dedicată pentru Detalii cont

### Ce se schimbă

1. **Creez `src/pages/AccountDetailsPage.tsx`** — pagină dedicată identică ca pattern cu `FavoritesPage.tsx`:
   - Back button → `/profile`
   - Titlu "Detalii cont" / "Account Details"
   - Render `<AccountTab />`

2. **Modific `src/pages/Profile.tsx`**:
   - Schimb `href: null` pe "Detalii cont" în `href: "/contul-meu"`
   - Toate cele 4 butoane devin `<Link>` (elimin logica `isActive` / `<div>`)
   - Elimin `<AccountTab />` — pagina Profile rămâne doar cu titlu, BalanceCard și cele 4 butoane
   - Elimin importul `AccountTab`

3. **Modific `src/App.tsx`**:
   - Adaug ruta `/contul-meu` → `AccountDetailsPage`

3 fișiere modificate/create.

