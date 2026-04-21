

## Plan: Sistem de notificări pentru Admin Dashboard

### Scop
Adminii primesc notificări **în timp real** despre evenimente care necesită atenție: KYC noi de revizuit, produse de aprobat, tickete deschise, cereri de retragere, conturi noi. Notificările apar:
1. Ca **badge cu număr** pe iconul clopoțel din header-ul admin (dropdown cu lista live)
2. Ca **card "Acțiuni necesare"** pe Admin Dashboard cu shortcut-uri grupate

### Arhitectură

#### 1. Bază de date (migrație nouă)

**Tabel nou `admin_notifications`** (separat de `notifications` user-facing — semantic diferit, nu legat de un singur user):
```sql
- id uuid pk
- type text  -- 'kyc_submitted', 'kyc_needs_review', 'product_pending',
             -- 'ticket_opened', 'ticket_message', 'withdrawal_requested',
             -- 'new_user_signup'
- title_ro text, title_en text
- description_ro text, description_en text
- link text          -- ex: /admin/kyc/<uuid>
- entity_id uuid     -- kyc_case_id / product_id / ticket_id...
- entity_type text   -- 'kyc_case' / 'product' / ...
- priority text      -- 'low' | 'normal' | 'high' (KYC review = high)
- is_read boolean default false  -- "citit" global (oricare admin marchează)
- created_at timestamptz
```
- **RLS**: SELECT/UPDATE doar pentru `has_role(auth.uid(),'admin')`; INSERT doar prin SECURITY DEFINER triggers/funcții.
- **Index**: `(is_read, created_at desc)` pentru query rapid.
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications`.

**Triggere automate** (toate `SECURITY DEFINER`):
| Eveniment sursă | Trigger | Tip notificare | Prioritate |
|---|---|---|---|
| `kyc_cases` INSERT/UPDATE → status = `SUBMITTED` | AFTER | `kyc_submitted` | normal |
| `kyc_cases` UPDATE → status = `NEEDS_MANUAL_REVIEW` | AFTER | `kyc_needs_review` | **high** |
| `products` INSERT (approval_status=`pending`) | AFTER | `product_pending` | normal |
| `ops_tickets` INSERT | AFTER | `ticket_opened` | normal (high dacă priority=URGENT) |
| `withdrawal_requests` INSERT (status=`pending`) | AFTER | `withdrawal_requested` | normal |
| `profiles` INSERT | AFTER | `new_user_signup` | low |

**RPC**: `get_admin_notification_summary()` returnează counts grupate pe tip pentru widget-ul dashboard (1 query, evită N+1).

#### 2. Cod frontend

**Fișiere noi**:
- `src/features/admin/adminNotificationsApi.ts` — `getAdminNotifications()`, `getAdminUnreadCount()`, `markAdminNotificationRead()`, `markAllAdminRead()`, `getAdminNotificationSummary()`
- `src/hooks/queries/useAdminNotifications.ts` — `useAdminNotifications()`, `useAdminNotificationSummary()` (cu invalidare la realtime push)
- `src/components/admin/AdminNotificationBell.tsx` — clopoțel cu badge unread, dropdown cu top 20, filter All/Unread, click → marchează ca citit + navighează la `link`
- `src/components/admin/AdminActionRequiredWidget.tsx` — card pe dashboard cu 4-6 tile-uri ("3 KYC de aprobat", "2 produse în așteptare", "1 ticket urgent" etc.) — click duce la modulul respectiv cu filtru aplicat

**Fișiere modificate**:
- `src/components/admin/AdminLayout.tsx` — adaug header cu `AdminNotificationBell` (vizibil pe desktop **și** mobile, înlocuiește header-ul minimal actual)
- `src/components/admin/AdminSidebar.tsx` — adaug item "Notificări" → `/admin/notifications` (opțional, listă completă)
- `src/pages/admin/AdminDashboard.tsx` — inserez `<AdminActionRequiredWidget />` deasupra grid-ului de stats
- `src/App.tsx` — rută nouă `/admin/notifications` → pagină listă completă
- `src/pages/admin/AdminNotifications.tsx` (nou) — pagină full-list cu filtre pe tip + paginare

#### 3. UX

**Bell în header admin** (poziționat dreapta-sus, lângă MobileAdminMenu):
- Badge roșu cu număr unread (max "9+")
- Dropdown desktop: titlu "Notificări admin", filter All/Unread, listă cu icon colorat per tip (Shield=KYC, Package=produs, Ticket=ticket, Banknote=retragere, UserPlus=user nou), timestamp relative, buton "Citește toate", footer link "Vezi toate"
- Mobile: full-screen overlay (același pattern ca `NotificationBell` user-facing existent — refolosesc design)

**Widget Dashboard "Acțiuni necesare"**:
```
┌──────────────────────────────────────────────────────┐
│  ⚠ Acțiuni necesare                                  │
├──────────────────────────────────────────────────────┤
│ [🛡 KYC: 3] [📦 Produse: 2] [🎫 Tickete: 1] [💰 Retrageri: 0] │
└──────────────────────────────────────────────────────┘
```
Tile-urile cu count > 0 apar cu border portocaliu (#F98715); cele cu 0 — gri șterse. Click → navighează la modulul respectiv cu filtrul corespunzător preselectat.

**Realtime**: Bell + widget se actualizează instant prin `supabase.channel('admin-notifications').on('postgres_changes', …)` — toți adminii conectați văd actualizările simultan.

### Diagramă flux

```text
[Eveniment business]
   ↓
[Trigger Postgres SECURITY DEFINER]
   ↓
INSERT admin_notifications (priority, link, entity)
   ↓
[Realtime broadcast]
   ↓
┌───────────────────────────┬──────────────────────────┐
│ AdminNotificationBell     │ AdminActionRequiredWidget│
│ (badge++ + toast push)    │ (counts refresh)         │
└───────────────────────────┴──────────────────────────┘
   ↓ click pe notificare
[markAdminNotificationRead] → navigate(link)
```

### Securitate
- `admin_notifications` complet izolat de `notifications` user — niciun risc de leak
- RLS deny-by-default; UPDATE permite oricărui admin să marcheze ca citit (semantic shared inbox)
- Triggere folosesc `SECURITY DEFINER` cu `SET search_path = public` (consistent cu restul DB)
- Conținut deja sanitizat (provine din ID-uri și nume deja existente)

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/migrations/<timestamp>.sql` | NOU — tabel + RLS + 6 triggere + RPC summary + realtime publication |
| `src/features/admin/adminNotificationsApi.ts` | NOU — CRUD + summary |
| `src/hooks/queries/useAdminNotifications.ts` | NOU — hooks React Query |
| `src/components/admin/AdminNotificationBell.tsx` | NOU — bell + dropdown + mobile fullscreen |
| `src/components/admin/AdminActionRequiredWidget.tsx` | NOU — widget dashboard |
| `src/pages/admin/AdminNotifications.tsx` | NOU — pagină listă completă |
| `src/components/admin/AdminLayout.tsx` | adaug header sticky cu bell (desktop + mobile) |
| `src/components/admin/AdminSidebar.tsx` | adaug item "Notificări" în meniu |
| `src/pages/admin/AdminDashboard.tsx` | adaug `<AdminActionRequiredWidget />` deasupra stats grid |
| `src/App.tsx` | rută nouă `/admin/notifications` |

### Limitări recunoscute
- **Notificare per-eveniment, nu per-admin**: dacă un admin marchează ca citit, dispare pentru toți — comportament dorit pentru shared inbox, dar înseamnă că nu există "neviewed by me" individual. Acceptabil pentru o echipă mică de admini.
- **Backfill**: notificările vechi (KYC trimise înainte de migrație) NU vor avea entry — putem rula un script one-time de seed în migrație pentru evenimentele active actuale (KYC pending + produse pending + tickete deschise).
- **Email/push**: doar in-app; nu trimitem email per notificare admin (am adăuga dacă cere ulterior).

