## Problemă

Redesign-ul premium a fost livrat pe ruta `/anunturi` (componenta `ListingsPage`).
Însă navigația principală ("Produsele mele" din `Owner.tsx`, butonul "anunțurile mele" din `AccountHubMenu`, plus linkul vechi din `LendingsTab`) trimite pe `/owner` — care încă renderează vechiul grid simplu. De aceea nu se vede nicio modificare.

## Soluție

Consolidăm o singură pagină pentru "Produsele mele / Anunțurile mele" și o facem accesibilă din ambele rute.

### 1. Ruta `/owner` → noul dashboard
- În `src/App.tsx`, înlocuim `<Route path="/owner" element={<Owner />} />` cu un redirect:
  `<Route path="/owner" element={<Navigate to="/anunturi" replace />} />`
- Eliminăm import-ul lazy `Owner` din `App.tsx` și ștergem fișierul `src/pages/Owner.tsx` (nu mai e referit nicăieri).

### 2. Verificare linkuri către dashboard
Confirmăm că toate intrările deja folosite duc la `/anunturi`:
- `MobileDrawer.tsx` → `/anunturi` ✓
- `NavGroups.tsx` → `/anunturi` ✓
- `AccountHubMenu.tsx` ("anunțurile mele") — actualizăm dacă mai trimite spre `/owner`.
- `NotificationsTab.tsx` deja mapează `#anunturi` și `?tab=lendings` la `/anunturi` ✓.
- Verificăm `Profile.tsx` și orice CTA "Vezi toate" din widget-uri pentru link-uri vechi `/owner`.

### 3. `LendingsTab` (sub-tab din Profile)
- Înlocuim conținutul cu un mic CTA + listă scurtă de 3 carduri folosind noul `ListingCard`, plus un buton "Vezi tot dashboard-ul" → `/anunturi`. Așa rămâne consistent cu redesign-ul, fără duplicat de logică.

### 4. Păstrăm intacte
- `/owner/new-product` și `/owner/edit-product/:id` rămân neschimbate (sunt pagini diferite, nu listare).
- Componentele noi din `src/components/listings/*` și `ListingsPage.tsx` rămân exact cum sunt.

## Fișiere modificate
- `src/App.tsx` — redirect `/owner` → `/anunturi`, drop `Owner` lazy import.
- `src/components/layout/AccountHubMenu.tsx` — link "anunțurile mele" → `/anunturi` (dacă nu e deja).
- `src/components/dashboard/LendingsTab.tsx` — simplificat, redirecționează către dashboard-ul complet.

## Fișiere șterse
- `src/pages/Owner.tsx`

## Out of scope
- Schimbări la `Owner.tsx` legate de creare/editare produse (acelea sunt în `NewProduct` / `EditProduct`).
- Modificări vizuale suplimentare la `ListingsPage` (deja livrat).
