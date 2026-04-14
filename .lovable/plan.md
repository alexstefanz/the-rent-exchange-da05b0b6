

## Plan: Adaugă stat "Bani Retrași" în Admin Dashboard

### Modificări

**1. Migrare SQL — actualizare funcția `get_admin_stats`**

Adaug un câmp nou `total_withdrawn` care calculează suma tuturor retragerilor completate din `withdrawal_requests`:

```sql
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(total_users bigint, total_products bigint, total_rentals bigint, 
              active_rentals bigint, revenue_this_month numeric, pending_kyc bigint,
              total_withdrawn numeric)
-- adaug: (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'completed')
```

**2. `src/features/admin/adminApi.ts`** — adaug `total_withdrawn: number` în interfața `AdminStats`

**3. `src/pages/admin/AdminDashboard.tsx`** — adaug un nou `StatsCard` cu iconița `Banknote` (din lucide-react), titlul "Bani Retrași" și valoarea formatată ca monedă. Grid-ul devine 7 carduri (se adaptează automat cu layout-ul existent).

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| Migrare SQL | Recreare `get_admin_stats` cu `total_withdrawn` |
| `src/features/admin/adminApi.ts` | Adaug câmpul în interfață + default |
| `src/pages/admin/AdminDashboard.tsx` | Nou StatsCard + import Banknote |

