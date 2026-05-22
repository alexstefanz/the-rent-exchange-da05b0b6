## Problem
În popover-ul „Notificări", când se face click pe dropdown-ul „Toate", lista de categorii se deschide în sus, peste header — în loc să se deschidă în jos sub trigger.

## Cauză
`SelectContent` din shadcn (Radix Select) folosește implicit modul `item-aligned`, care încearcă să alinieze item-ul selectat cu trigger-ul. Când component-ul e randat într-un popover cu spațiu redus deasupra/dedesubt, Radix decide să flip-uiască conținutul deasupra trigger-ului → exact ce se vede în imaginea 2.

## Fix
În `src/components/notifications/NotificationFilters.tsx`, forțăm `SelectContent` să se deschidă în jos folosind modul `popper` cu `side="bottom"`:

```tsx
<SelectContent position="popper" side="bottom" sideOffset={6} align="start" className="max-h-64">
```

- `position="popper"` → folosește poziționarea bazată pe trigger (nu item-aligned).
- `side="bottom"` + `sideOffset={6}` → forțează deschiderea sub trigger.
- `align="start"` → aliniat la stânga trigger-ului.
- `max-h-64` → previne dropdown-ul prea înalt care ar putea fi acoperit de marginea popover-ului.

## Fișiere atinse
```text
src/components/notifications/NotificationFilters.tsx   (props pe SelectContent)
```

Strict fix UI, fără modificări de logică.