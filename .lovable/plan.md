## Problema

În `src/pages/admin/AdminNotifications.tsx`, filtrele de tip afișează cheia brută din DB (`cancellation_requested`, `sla_breach`) când nu există în `TYPE_LABELS`, și nu arată câte notificări sunt în fiecare categorie. Adminii nu pot scana rapid ce e important.

## Schimbări (un singur fișier: `src/pages/admin/AdminNotifications.tsx`)

### 1. Completez `TYPE_LABELS` cu toate cheile reale

Adaug etichete RO clare pentru toate tipurile emise de backend:

- `cancellation_requested` → "Cerere de anulare"
- `cancellation_approved` → "Anulare aprobată"
- `cancellation_rejected` → "Anulare respinsă"
- `sla_breach` → "SLA depășit"
- `dispute_opened` → "Dispută deschisă"
- `payout_failed` → "Plată eșuată"
- `refund_requested` → "Cerere refund"
- `kyc_rejected` → "KYC respins"
- `product_reported` → "Produs raportat"
- `user_reported` → "Utilizator raportat"
- Fallback pentru orice cheie necunoscută: transform `snake_case` în "Snake Case" (în loc să afișez cheia brută).

### 2. Numărători pe fiecare chip de tip

Calculez `countsByType` (Record<string, number>) din lista completă de notificări și afișez `Eticheta (N)` pe fiecare chip — la fel cum apare deja "Necitite (4)". Chip-urile cu zero notificări nu se mai randează.

### 3. Grupare vizuală în 3 categorii (taburi în loc de o singură rolă lungă de chip-uri)

Pe ecran sunt deja 7+ chip-uri și vor crește. Introduc o grupare simplă pe categorii ca să nu se aglomereze rândul:

- **Urgent / SLA**: `sla_breach`, `dispute_opened`, `cancellation_requested`, `payout_failed`
- **Moderare**: `product_pending`, `kyc_submitted`, `kyc_needs_review`, `kyc_rejected`, `product_reported`, `user_reported`
- **Operațional**: `ticket_opened`, `ticket_message`, `withdrawal_requested`, `refund_requested`, `cancellation_approved`, `cancellation_rejected`, `new_user_signup`

Implementare: un rând cu 3 taburi de categorie + chip "Toate" (cu contoare la fiecare tab). Sub tabul activ se randează doar chip-urile cu type-uri din acea categorie. Tipurile necunoscute apar într-o categorie implicită "Altele".

### 4. Iconițe + culori coerente pe chip

Fiecare chip primește un mic dot colorat (`bg-red-500`, `bg-orange-500`, `bg-blue-500`, `bg-purple-500`, `bg-green-500`) prin aceeași mapare folosită deja în `getIcon`, ca să recunoști vizual tipul fără să citești textul. Pentru `cancellation_*` și `sla_breach`, dot roșu/portocaliu. Adaug și mapările lipsă din `getIcon`.

### 5. Iconițe în pastila urgentă

Chip-urile din categoria "Urgent / SLA" primesc fundal `bg-destructive/10 text-destructive` și un `AlertTriangle` mic la stânga, ca adminul să scaneze instant ce arde.

### 6. Empty state per filtru

Mesaj diferit: "Nu există notificări de tip *Eticheta*" sau "Inbox curat 🎉" când nu sunt necitite.

## Ce NU schimb

- Logica de fetch (`useAdminNotifications`), DB, RLS — neatinse.
- Schema `admin_notifications`.
- Restul layout-ului paginii (header, lista de notificări).

Modificările sunt strict frontend/prezentare, într-un singur fișier.
