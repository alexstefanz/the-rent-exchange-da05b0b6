## Modificări

### 1. Redirecționare carduri profil către „Contul Meu" (/profile)
Cardul de profil din dropdown și din drawer-ul mobil duce momentan la `/contul-meu` (pagina de setări). Îl mut pe `/profile` (hub-ul „Salut!"):

- `src/components/layout/AccountHubMenu.tsx` — `HeaderCard` `onNav("/contul-meu")` → `onNav("/profile")`; eticheta „Vezi cont" rămâne.
- `src/components/layout/mobile-drawer/DrawerProfileHero.tsx` — `to="/contul-meu"` → `to="/profile"`.
- `src/components/layout/mobile-drawer/DrawerAccountHealth.tsx` — link „Completează profilul" rămâne pe `/contul-meu` (este buton explicit de setări) — dar îl mut tot pe `/profile` pentru consistență (hub-ul are CTA-ul de completare). Confirm asta dacă vrei separat.

### 2. Buton „Setări cont" în bannerul Contul Meu
În `src/components/profile/dashboard/AccountHeroCard.tsx`, în zona din dreapta (lângă „Completează profilul" și butonul de profil public), adaug un buton secundar:

- `Button` `variant="outline"` cu iconiță `Settings` (lucide) + text bilingv „Setări cont" / „Account settings", link către `/contul-meu`.
- Pe desktop apare în rândul de acțiuni de sub progress bar (alături de „Completează profilul" și butonul ExternalLink).
- Layoutul rămâne responsive: pe mobil/tabletă butoanele se aranjează deja pe lățime completă (`w-full` pe coloana din dreapta), butonul nou se adaugă în același `flex gap-2` și rămâne accesibil.

### 3. Fără alte modificări
- Nu schimb rutele din `App.tsx` (ambele rămân active).
- Nu modific pagina `AccountDetailsPage` în sine.
- Fără modificări de backend / RLS / edge functions.

## Detalii tehnice

- Iconițe: `Settings` din `lucide-react` (deja folosit în alte zone).
- Stil buton: `variant="outline"` size implicit, pentru a contrasta cu CTA-ul portocaliu primar „Completează profilul".
- Texte adăugate inline cu helper-ul `t("Setări cont", "Account settings")` (pattern existent în fișier).
