## Unificarea sistemului de toast notifications

Toate toast-urile vor folosi același card (stilul actual `RentalToast`), dar cu icon și accent colorat în funcție de tipul de notificare. În plus, conectăm cardul la notificările realtime din DB, astfel încât orice eveniment (cerere, confirmare, anulare, plată, suport, sistem) să apară cu același design.

### 1. Extindere `src/lib/notify.tsx`

Refactor `RentalToast` într-un `NotificationToast` generic care primește o **variantă**:

- `confirmation` → ✅ `CheckCircle2`, verde (`emerald-500`)
- `cancellation` → ❌ `XCircle`, roșu (`red-500`)
- `payment` → 💰 `Wallet`, verde (`emerald-500`)
- `support` → 💬 `LifeBuoy`, albastru (`blue-500`)
- `system` → 🔔 `Bell`, albastru (`blue-500`)
- `message` → ✉️ `MessageCircle`, albastru
- `request` → 📨 `Send`, ambră (fallback pentru "cerere trimisă")

Cardul păstrează layout-ul actual (380px, rounded-2xl, shadow, X close), dar înlocuiește thumbnail-ul opțional cu un **halo colorat** (cerc 48×48 cu `bg-{color}/15` și icon `text-{color}`). Dacă există `image`, se afișează imaginea într-un thumbnail pătrat, iar iconul de variantă apare ca **badge mic** în colțul dreapta-jos al thumbnail-ului. Accent bar verticală subtilă pe stânga (1px × full height) în culoarea variantei.

API nou:

```ts
notify.confirmation({ title, message, image? })
notify.cancellation({ title, message, image? })
notify.payment({ title, message, image? })
notify.support({ title, message })
notify.system({ title, message })
notify.message({ title, message, image? })
// păstrăm notify.rental ca alias pentru notify.request (compat Checkout)
```

`success`/`error`/`info` rămân ca alias-uri care apelează noul card cu varianta potrivită, ca tot proiectul să fie consistent.

### 2. Mapare automată din `notifications` (DB) → variantă toast

În `src/lib/notify.tsx` expunem helper `notifyFromDb(notification)` care folosește `categorize()` din `src/lib/notificationCategory.ts`:

- `reservation` cu type conținând `confirm`/`approved` → `confirmation`
- `reservation` cu type conținând `cancel`/`rejected` → `cancellation`
- `payment`/`payout` → `payment`
- `support`/`ticket` → `support`
- `message` → `message`
- `urgent` (dispute, kyc reject, etc.) → `cancellation` (roșu)
- restul → `system`

### 3. Realtime: arătăm toast pentru orice notificare nouă

În `src/hooks/useGlobalRealtime.ts` adăugăm un listener pe `INSERT public.notifications WHERE user_id=eq.${userId}`:

- invalidează `["notifications", userId]`
- apelează `notifyFromDb(payload.new)` folosind `title_*` / `description_*` pe baza limbii curente (citim din `localStorage` sau printr-un mic event emitter din `LanguageContext` pentru a nu introduce dependențe de hook în hook).

Astfel proprietarul primește toast la anulări (chiar dacă email-ul e blocat de domeniu), chiriașul la confirmări/plăți etc.

### 4. Atingeri minime

- `NotificationsTab.tsx`: fără schimbări (folosește deja DB list + iconițe proprii).
- `Checkout.tsx`: `notify.rental(...)` rămâne funcțional (alias către `request`).

### Detalii tehnice

- Continuăm cu `toast.custom` + `unstyled: true` + `classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0" }`.
- Culorile se setează prin clase Tailwind statice mapate într-un `VARIANT_STYLES` record (nu interpolare dinamică, ca Tailwind să le includă în build).
- Position: `top-center` pentru toate (consistent cu Sonner global), `duration` default 6s (10s pentru `cancellation` ca să fie observabilă).
- Icoanele vin din `lucide-react` (deja folosite).
