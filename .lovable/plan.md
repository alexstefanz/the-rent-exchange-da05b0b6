# Notificări admin mai vizibile

Pentru utilizatorii admin, notificările sunt prea discrete. Le facem evidente în două locuri.

## 1. Card "My Account" (AccountHeroCard) — badge mare colț dreapta-sus

În `src/components/profile/dashboard/AccountHeroCard.tsx`:
- Detectăm rolul de admin cu `useIsAdmin(user?.id)` și citim `useAdminNotificationSummary()` pentru numărul de necitite.
- Dacă `isAdmin` și `unreadCount > 0`, afișăm un badge poziționat absolut (top-right al cardului), vizibil și pe mobil:
  - pastilă portocalie (primary `#F59E0B`) cu iconiță `Bell`, textul "X notificări admin" (RO) / "X admin alerts" (EN), număr îngroșat
  - mic punct verde pulsant atașat pentru a semnala "live"
  - întregul badge este `Link` către `/admin/notifications`
  - umbră pronunțată + animație `motion` (scale-in) ca să iasă în evidență

Nu modificăm restul cardului; doar adăugăm elementul absolut într-un wrapper deja `relative`.

## 2. Header — punct verde lângă avatarul din `AccountHubMenu`

În `src/components/layout/AccountHubMenu.tsx`, în butonul `trigger` (linia 300):
- Pentru admini, dacă există notificări admin necitite, înlocuim/duplicăm punctul existent `bg-primary` cu unul `bg-emerald-500`, mai mare (`h-3 w-3`), cu `ring-2 ring-background` și `animate-pulse`.
- Logica: `if (isAdmin && adminUnread > 0) → punct verde admin`, altfel păstrăm comportamentul curent (`hasActivity` portocaliu).
- Aceeași sursă de date: `useAdminNotificationSummary()` (deja folosit în AdminSidebar, are realtime).

## Detalii tehnice

- Hook-uri reutilizate: `useIsAdmin` (deja importat în AccountHubMenu), `useAdminNotificationSummary` (deja are realtime via `useAdminNotifications` cache invalidation — adăugăm și subscripția în varianta summary, sau apelăm `useAdminNotifications` doar pentru side-effect de subscribe).
- În `AccountHeroCard`, importăm `useAuth` pentru `user?.id` (acum nu îl folosește).
- Tokens: folosim `bg-primary text-primary-foreground` pentru badge, `bg-emerald-500` pentru dotul "live" (există deja în proiect — `DrawerProfileHero`).
- Bilingv prin `t()` din `useLanguage`.
- Fără modificări de business logic, RLS, sau API.

## Fișiere atinse

- `src/components/profile/dashboard/AccountHeroCard.tsx` — adaugă badge admin
- `src/components/layout/AccountHubMenu.tsx` — punct verde admin pe avatar
- (opțional) `src/hooks/queries/useAdminNotifications.ts` — asigurăm că `useAdminNotificationSummary` se invalidează în realtime (dacă nu deja)
