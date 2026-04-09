

## Plan: Widget suport admin vizibil pe tot site-ul

### Ce se schimbă

Cel mai simplu: eliminăm condiția `!isAdminRoute` din `AdminSupportWidget.tsx`. Widget-ul deja verifică dacă utilizatorul are rol de admin (`isAdmin`), deci va apărea doar pentru admini, dar pe **orice pagină** a site-ului — nu doar pe `/admin`.

### Modificare

**`src/components/admin/AdminSupportWidget.tsx`** — linia 193:
- Din: `if (!isAdmin || !isAdminRoute) return null;`
- În: `if (!isAdmin) return null;`
- Ștergem și variabila `isAdminRoute` (linia 44) și importul `useLocation` dacă nu mai e folosit

### Rezultat
Adminul vede iconița floating cu notificări de suport pe orice pagină a site-ului, nu doar în panoul admin.

