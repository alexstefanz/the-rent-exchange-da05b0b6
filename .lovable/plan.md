

## Plan: Carduri clickable pe Admin Dashboard

### Modificări

**1. `src/components/admin/StatsCard.tsx`** — Adaug prop opțional `onClick` și/sau `href`. Când e prezent, cardul devine clickable cu `cursor-pointer` și hover effect.

**2. `src/pages/admin/AdminDashboard.tsx`** — Adaug `onClick={() => navigate('/admin/...')}` pe fiecare StatsCard:

| Card | Ruta |
|---|---|
| Total Utilizatori | `/admin/users` |
| Produse Active | `/admin/products` |
| Total Rezervări | `/admin/reservations` |
| Rezervări Active | `/admin/reservations` |
| Venituri Luna Asta | `/admin/finances` |
| KYC În Așteptare | `/admin/kyc` |
| Bani Retrași | `/admin/finances` |

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/admin/StatsCard.tsx` | Adaug prop `onClick`, styling hover/cursor |
| `src/pages/admin/AdminDashboard.tsx` | Import `useNavigate`, adaug `onClick` pe fiecare card |

