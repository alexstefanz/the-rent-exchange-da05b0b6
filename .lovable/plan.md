## Obiectiv
În `/admin/users` să fie vizibil clar care utilizatori sunt **banați** și care au primit **avertismente**, plus posibilitatea de a-i filtra rapid.

## Ce se modifică

### 1. RPC `get_admin_users` (migrare DB)
Extind funcția să returneze și:
- `is_banned`, `ban_reason`, `banned_at` (din `profiles`)
- `warnings_count` (count din `user_warnings` per user)
- `last_warning_at` (cel mai recent `created_at` din `user_warnings`)
- `total_earned`, `total_spent` (lipsesc azi din RPC, deși UI-ul le afișează — momentan apar 0)

Adaug parametru opțional `status_filter text` cu valori: `null` (toți), `banned`, `warned`, `active`.

### 2. `src/features/admin/adminApi.ts`
- Extind tipul `AdminUser` cu noile câmpuri (`is_banned`, `ban_reason`, `banned_at`, `warnings_count`, `last_warning_at`).
- Adaug parametrul `statusFilter` în `fetchAdminUsers`.

### 3. `src/hooks/queries/useAdminStats.ts`
- `useAdminUsers` primește și `statusFilter`, intră în queryKey.

### 4. `src/pages/admin/AdminUsers.tsx`
- **Bara de filtre** deasupra search-ului: tab-uri / butoane toggle „Toți | Activi | Banați | Avertizați” + counts.
- **Coloana „Status”** (desktop) și badge-urile mobile arată acum:
  - `BANAT` (roșu, deja există) + tooltip cu `ban_reason` și data
  - `Avertizat (N)` (portocaliu, nou) când `warnings_count > 0` — se arată și pe useri banați (cumulativ)
  - `Activ` doar când nu e nici banat, nici avertizat
- În panoul expandat afișez:
  - dacă banat: motiv + data ban-ului
  - dacă avertizat: număr avertismente + data ultimului
  - link „Vezi profil complet” rămâne pentru detalii

## În afara scope-ului
- Pagina de detaliu admin user (`/admin/users/:id`) — nu e atinsă.
- Logica de ban / warning în sine — folosim doar datele existente.
