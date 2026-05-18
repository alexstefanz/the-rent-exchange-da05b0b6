# Redesign notificări (toast)

## Obiectiv
Modernizăm toast-urile platformei (Sonner): centrate sus, durată 3s, buton de închidere, card cu soft shadow. În plus, când notificarea ține de o închiriere, în stânga apare poza principală a produsului iar lângă ea titlul produsului.

## Modificări

### 1. `src/components/ui/sonner.tsx` — config global Sonner
- `position="top-center"`
- `duration={3000}`
- `closeButton`
- `toastOptions.classNames.toast`: card alb (`bg-background`), `rounded-2xl`, `border border-border/60`, `shadow-[0_10px_40px_-12px_hsl(var(--foreground)/0.15)]`, padding generos, font Plus Jakarta Sans (moștenit), icon aliniat centrat-vertical.
- Stil pentru `closeButton` (vizibil în dreapta-sus, hover subtil).
- Aceleași tokens pentru `success` / `error` / `info` (doar accent color pe iconiță), păstrând paleta brand (#F59E0B).

### 2. `src/lib/notify.tsx` (fișier nou) — helper-i centralizați
- `notify.success(message)`, `notify.error(...)`, `notify.info(...)` — wrappers peste `sonner` toast (păstrează stilul nou).
- `notify.rental({ image, title, message, variant? })` — folosește `toast.custom(...)` și randează un card cu layout:
  ```text
  [ img 48x48 rounded-xl ]  Titlu produs (font-semibold, line-clamp-1)
                            Mesaj (text-sm text-muted-foreground, line-clamp-2)
                                                                   [x]
  ```
  - Imagine: `object-cover`, fallback la placeholder dacă lipsește.
  - Card: aceleași clase ca toast-ul global (soft shadow, rounded-2xl), lățime ~380px, centrat.
  - Buton închidere integrat (`X` din lucide) care apelează `toast.dismiss(id)`.
  - Durată 3000ms.

### 3. Înlocuim apelurile relevante
- `src/pages/Checkout.tsx` (linia 122): înlocuim `toast.success("Cererea a fost trimisă!…")` cu `notify.rental({ image: product.images[0], title: product.title, message: t("Cererea a fost trimisă! Vei fi notificat când proprietarul răspunde.", "Request sent! …") })`.
- `src/components/rentals/EarlyReturnRequestDialog.tsx`: la fel, folosind imaginea + titlul produsului închirierii.
- Restul `toast.success/.error` din platformă rămân pe noul stil global automat (nicio modificare necesară).

### 4. Curățare
- `<Toaster />` legacy (shadcn) din `src/App.tsx` rămâne (folosit de cod vechi) — dar îl putem lăsa neatins ca să nu introducem regresii; toate locurile noi folosesc Sonner.

## Validare
- Trigger flow checkout → trebuie să apară toast centrat-sus cu poza produsului în stânga + titlu + mesaj, soft shadow, buton X, dispare după 3s.
- Toast-uri generice (ex. erori login) → același card modern centrat, X vizibil, 3s.
- Verificare pe mobile: toast rămâne centrat, lățime ≤ `calc(100vw - 32px)`.
