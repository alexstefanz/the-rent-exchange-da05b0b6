## Premium Notification Center

Restructurăm complet componenta `NotificationBell` și pagina `/notificari` într-un sistem unificat, premium, realtime, mobile-first.

### Componente noi (în `src/components/notifications/`)

```text
NotificationBell.tsx          # trigger (bell + animated badge)
NotificationCenter.tsx        # shared container (header + filters + body)
NotificationGroup.tsx         # grupare temporală (Astăzi / Ieri / Săptămâna)
NotificationCard.tsx          # card premium per item
NotificationIcon.tsx          # icon contextual + halo color tag
NotificationActions.tsx       # CTA-uri rapide (Acceptă / Chat / Plată / Ticket)
NotificationFilters.tsx       # chips: Toate · Rezervări · Mesaje · Plăți · Suport · Sistem
NotificationSettingsSheet.tsx # mini panel: push / email / sms / quiet hours
NotificationEmpty.tsx         # empty state premium cu sugestii
NotificationSkeleton.tsx      # shimmer loading
```

### Comportament desktop

- Trigger Bell rămâne în Navbar.
- Click → `Popover` 420px lățime, `max-h-[640px]`, `rounded-2xl`, `shadow-xl`, animație `animate-scale-in`.
- Conținutul folosește `NotificationCenter` (același cod ca pe mobil).
- Footer fix: „Vezi toate" + „Setări" (deschide `NotificationSettingsSheet`).

### Comportament mobile

- Click → `Sheet side="bottom"` cu `h-[100dvh]`, drag handle sus, header sticky, listă scrollabilă cu `overscroll-contain`.
- Inspirat din Airbnb inbox (full-screen, sticky filter bar).

### Header premium (shared)

```text
┌──────────────────────────────────────┐
│ Notificări                    ⚙  ✓  │
│ Ai 2 notificări noi                  │
│ [Toate] [Rezervări] [Mesaje] [Plăți] │
└──────────────────────────────────────┘
```

- Titlu bold + subtitlu live („Ai N notificări noi" / „Ești la zi").
- Buton ⚙ deschide settings sheet, ✓ marchează toate citite (apare doar dacă există unread).
- Chips de filtru orizontale, scrollabile, cu count per categorie.

### Notification Card

- Layout: `[icon halo 40px] [titlu bold + descriere muted + timestamp + CTA-uri] [pulse dot unread]`.
- `rounded-xl`, `p-3`, hover `bg-muted/40`, unread `bg-primary/[0.04]` + bară laterală 2px primary.
- Typography: titlu `text-sm font-semibold`, descriere `text-xs text-muted-foreground line-clamp-2`, timestamp `text-[11px] text-muted-foreground/70`.
- Categoric color halo (background icon):
  - Rezervări: emerald
  - Mesaje: blue
  - Plăți: violet
  - Suport: amber
  - Sistem: slate
  - Acțiune urgentă: red cu badge „Acțiune"
- Mapping `type → category` într-un util nou `notificationCategory.ts` (map exhaustiv pe baza valorilor existente: `message`, `rental_request`, `rental_confirmation`, `reservation`, `view`, `review`, `kyc_*`, `payment_*`, `ticket_*` etc.).

### Quick actions contextuale

În `NotificationActions` mapăm `type` → 1-2 butoane mici (`size="sm"`, `variant="outline"`) afișate în interiorul cardului:

- `rental_request` (la owner) → „Vezi cererea" → `/rezervari`
- `rental_confirmation` → „Discută cu proprietarul" → conversation API
- `message` → „Răspunde" → `/mesaje?conv=...`
- `payment_*` → „Vezi plata" → `/castiguri`
- `ticket_*` → „Deschide ticket" → `/suport`
- `inspection_pending` → „Completează proces verbal"

### Timeline grouping

`NotificationGroup` împarte vizual lista pe baza `created_at`:

- Astăzi
- Ieri
- Săptămâna aceasta
- Mai vechi

Separator: label uppercase `text-[11px] tracking-wider text-muted-foreground` cu linie subțire.

### Realtime UX

- Hook nou `useNotificationsRealtime` (TanStack Query + Supabase Realtime channel pe `notifications` filtrat după `user_id`).
- La INSERT nou:
  - `queryClient.setQueryData` pentru optimistic prepend
  - card intră cu `animate-fade-in slide-in-top`
  - badge bell pulsează (`animate-pulse` 1.5s, apoi static)
  - opțional sunet subtil dezactivabil din settings (nu implementăm sunetul în această iterație, lăsăm hook-ul pregătit)
- Counter-ul din badge folosește `useCountUp` (deja există) pentru tranziție smooth.

### Empty state

- Ilustrație Lucide `BellOff` într-un cerc primary/10, titlu „Ești la zi", subtext „Te anunțăm imediat ce se întâmplă ceva important", + 2 sugestii (link-uri): „Explorează produse" / „Adaugă un anunț".

### Settings Sheet

Sheet lateral (desktop) / bottom (mobile) cu 4 toggle-uri: Push, Email, SMS, Quiet hours (interval picker 22:00-08:00). Persistăm în `profiles` extending coloanele existente dacă lipsesc — în această iterație mapăm doar `sms_notifications_enabled` (există) + adăugăm preferințe locale în `localStorage` ca fallback pentru push/email/quiet hours, urmând ca migrarea să fie făcută separat când persistăm pe server.

### Pagina `/notificari`

Refacem `NotificationsPage` să folosească `NotificationCenter` cu prop `variant="page"`: layout container, max-w-2xl, hero header mai mare, fără sheet wrapping. Refolosește exact aceleași cards/groups/filters → zero duplicare.

### Micro-interacțiuni

- Hover: `transition-all duration-200`, slight `bg-muted/40`.
- Mark-as-read: pulse dot dispare cu `scale-out` 200ms, bara laterală fade.
- Swipe-to-dismiss (mobile): folosim `framer-motion` `drag="x"` pe card, threshold 80px → `markAsRead` (fără delete, deja nu avem delete pe API).
- Skeleton: 5 carduri shimmer la prima încărcare.

### Files to edit

- `src/components/layout/NotificationBell.tsx` → reescris (subțire, doar trigger + Popover/Sheet).
- `src/pages/NotificationsPage.tsx` → folosește `NotificationCenter variant="page"`.
- `src/features/profile/notificationsApi.ts` → adăugăm helper `groupByDay` și `categorize(type)`.
- `src/hooks/queries/useNotifications.ts` (nou) → React Query + realtime.

### Out of scope (rămâne pentru altă iterație)

- Persistarea preferințelor push/email/quiet hours pe server (necesită migrare).
- Push notifications efective (web push subscription).
- Sunet de notificare.
