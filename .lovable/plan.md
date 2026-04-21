

## Plan: Eliminare panou notificări și clopoțel din Admin Dashboard

### Scop
Elimin complet sistemul de notificări vizuale din admin panel (clopoțelul din header + widget-ul "Acțiuni necesare" din dashboard), deoarece badge-urile cu numere pe item-urile din sidebar (KYC, Confirmări, Tickete, Financiar, Notificări) oferă deja aceeași informație într-un mod mai concis.

### Componente eliminate

1. **Clopoțelul din header admin** (`AdminNotificationBell`)
   - Folosit în `AdminLayout.tsx` (header desktop) și `MobileAdminMenu.tsx` (mobil)
   - Afișează badge roșu cu numărul de notificări necitite + dropdown cu listă

2. **Widget "Acțiuni necesare"** (`AdminActionRequiredWidget`)
   - Folosit în `AdminDashboard.tsx` în partea de sus a paginii
   - Listează ticketele deschise, KYC-uri în așteptare, produse pending etc.

### Modificări

| Fișier | Acțiune |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Elimin import + render `<AdminNotificationBell />` din header desktop |
| `src/components/admin/MobileAdminMenu.tsx` | Elimin import + render `<AdminNotificationBell />` din header mobil |
| `src/pages/admin/AdminDashboard.tsx` | Elimin import + render `<AdminActionRequiredWidget />` |
| `src/components/admin/AdminNotificationBell.tsx` | **ȘTERG** fișierul complet |
| `src/components/admin/AdminActionRequiredWidget.tsx` | **ȘTERG** fișierul complet |

### Păstrate (intacte)

- `src/pages/admin/AdminNotifications.tsx` — pagina dedicată `/admin/notifications` rămâne accesibilă din sidebar (item "Notificări" cu badge roșu deja existent)
- `src/features/admin/adminNotificationsApi.ts` — API folosit de pagina de notificări și de hook-ul de summary
- `src/hooks/queries/useAdminNotifications.ts` — hook folosit în continuare de `AdminSidebar` pentru badge-uri și de `AdminNotifications.tsx`
- `src/components/admin/AdminSidebar.tsx` — neatins, badge-urile cu numere rămân pe item-urile relevante

### Rezultat

- Header admin curat — fără clopoțel
- Dashboard admin curat — fără widget de "Acțiuni necesare" în partea de sus (rămâne stats grid + restul widget-urilor existente: `AdminSupportWidget`, `DashboardCategoriesWidget` etc.)
- Sursa unică de notificări vizuale = badge-urile pe sidebar items + pagina `/admin/notifications`

### Limitări recunoscute

- Pagina `/admin/notifications` rămâne accesibilă doar prin click pe item-ul "Notificări" din sidebar (nu mai există shortcut din header)
- Realtime push pe `admin_notifications` continuă să funcționeze (folosit de hook-ul comun `useAdminNotifications` pentru actualizarea badge-urilor)

