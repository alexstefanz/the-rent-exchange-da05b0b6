## Modificări

### 1. Scoatem tabul "Mesaje" din filtre
**`src/lib/notificationCategory.ts`** — eliminăm `"message"` din `ALL_CATEGORIES` (rămâne: reservation, payment, support, system). Categoria în sine rămâne definită (pentru styling), dar nu mai apare ca chip de filtrare. Notificările tip mesaj vor cădea pe tabul "Toate".

### 2. Dropdown-ul afișează doar necitite (popover desktop + sheet mobil)
**`src/components/notifications/NotificationCenter.tsx`**:
- Doar pentru `variant !== "page"` (deci dropdown + sheet), filtrăm lista la `is_read === false` înainte de aplicarea filtrului categoric.
- Counts pe chips devin counts pe necitite (recalculăm `counts` din lista necitită când nu suntem pe `page`).
- Subtitlul header-ului rămâne („Ai X notificări noi" / „Ești la zi").
- Empty state când nu sunt necitite: variantă nouă cu mesaj „Ești la zi" (folosim `NotificationEmpty` existent — variant `"all"` e ok, sau adăugăm un text simplu inline).
- Pagina `/notificari` (variant `page`) rămâne neschimbată și arată toate notificările.

### 3. Buton "Vezi toate notificările" prominent portocaliu
**`src/components/notifications/NotificationCenter.tsx`** — footer link devine:
- `bg-primary text-primary-foreground` (portocaliu Rentli #F59E0B + alb)
- `hover:bg-[hsl(var(--primary-hover))]` sau `hover:opacity-90`
- padding mai mare (`py-3.5`), `font-semibold`, `text-sm`, fără border-top (sau border-top subtil)
- arrow icon mic la dreapta pentru semnal vizual

Toate folosesc tokens semantice — nicio culoare hardcodată.

### Fișiere atinse
- `src/lib/notificationCategory.ts`
- `src/components/notifications/NotificationCenter.tsx`
