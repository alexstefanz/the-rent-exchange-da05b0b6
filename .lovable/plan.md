## Animație push la back din chat (mobil)

Când utilizatorul apasă butonul back din header-ul chatului pe mobil, chatul iese spre dreapta (slide-out-right) și lista de conversații apare dedesubt — efect tip "push back" similar cu navigarea nativă iOS/Android.

### Modificări

**`tailwind.config.ts`** — adăugăm animația dacă nu există deja `slide-out-right` cu durată potrivită (~280ms ease-out). `slide-in-right` există deja în keyframes-urile standard; ne asigurăm că ambele sunt disponibile ca `animate-slide-out-right` și `animate-slide-in-right`.

**`src/pages/Messages.tsx`** (containerul fullscreen mobil al chatului):
- Adăugăm state local `isClosing: boolean`.
- `handleBack` pe mobil cu `?conv=`:
  1. setează `isClosing = true` (declanșează clasa `animate-slide-out-right`)
  2. după ~280ms (timer sau `onAnimationEnd`): face `navigate("/mesaje", { replace: true })` și `setSelectedConversation(null)`, apoi `setIsClosing(false)`
- Containerul fullscreen primește condițional `animate-slide-in-right` la deschidere și `animate-slide-out-right` când `isClosing`.
- Pentru cazul `returnTo` (back din chat deschis de pe pagina produsului) păstrăm comportamentul existent fără animație, ca să nu interfereze cu navigarea inter-pagini.

**`src/components/profile/MessagesTab.tsx`** (varianta din tab-ul profil) — aceeași logică: `isClosing`, slide-out-right pe container, apoi `setSelectedConversation(null)`. Slide-in-right la deschidere.

### Detalii tehnice
- Folosim utilitarele Tailwind existente (`animate-slide-in-right`, `animate-slide-out-right` cu `0.3s ease-out`), fără librării noi.
- Durata animației de ieșire = durata clasei (≈300ms). Folosim `onAnimationEnd` pe container pentru a evita timer drift.
- `will-change: transform` și `transform-gpu` pe container pentru fluiditate.
- Doar pe mobil (`!isDesktop`). Pe desktop chatul rămâne fără animație (split view).

### Niciun alt fișier modificat
Nu sunt necesare schimbări de backend, RLS sau în `ChatHeader.tsx` / `ChatPanel.tsx`.
