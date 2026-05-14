## Filtre pe 2 rânduri în Notificări

### Schimbări

**`src/components/notifications/NotificationFilters.tsx`**
- Componenta primește un prop nou `readFilter: "all" | "unread" | "read"` și `onReadChange`.
- Randează două rânduri:
  - **Rândul 1** (stare citire): chips „Toate mesajele" / „Necitite" / „Citite" cu count fiecare.
  - **Rândul 2** (categorie): chips existente Rezervări, Plăți, Suport, Sistem + „Toate" categoriile.
- Wrap pe mobil cu `flex-wrap` în loc de `overflow-x-auto`, ca să se vadă tot tabul Sistem fără scroll lateral.

**`src/components/notifications/NotificationCenter.tsx`**
- Adaugă state `readFilter` (default `"all"` pe page, `"unread"` pe popover/sheet — păstrând comportamentul actual de „doar necitite în dropdown").
- `visibleNotifications` aplică `readFilter` în loc de hard-filter `is_read === false` doar pentru variant ≠ page.
- Recalculează `counts` per categorie pe lista filtrată după `readFilter`.
- Pasează `readFilter`, `onReadChange` și `readCounts` (`{ all, unread, read }`) către `NotificationFilters`.

### Comportament rezultat
- `/notificari`: două rânduri vizibile, default „Toate mesajele" + categoria „Toate" → arată tot.
- Dropdown desktop / sheet mobil: default „Necitite" (păstrăm cerința anterioară), userul poate trece pe „Toate"/„Citite" dacă vrea.
- Niciun chip tăiat — categoriile încap pe un singur rând wrap-ed.

### Fișiere atinse
- `src/components/notifications/NotificationFilters.tsx`
- `src/components/notifications/NotificationCenter.tsx`