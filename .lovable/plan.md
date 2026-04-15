

## Plan: Fix mobile layout padding pe Admin Dashboard

### Problema
Pe mobil (390px), secțiunile "Ultimele Rezervări" și "Categorii Platformă" sunt decalate spre dreapta din cauza padding-ului `p-6` (24px) din `AdminLayout.tsx` combinat cu conținutul care depășește lățimea disponibilă. Aceasta creează overflow orizontal.

### Modificări

**1. `src/components/admin/AdminLayout.tsx`** (linia 42)
- Schimb `p-6` cu `p-4 md:p-6` pentru padding mai mic pe mobil
- Adaug `overflow-x-hidden` pe main pentru a elimina scroll-ul orizontal

**2. `src/pages/admin/AdminDashboard.tsx`**
- Pe rental items (linia 148): adaug `min-w-0` pe container-ul flex pentru a preveni overflow
- Adaug `overflow-hidden` pe wrapper-ul principal `space-y-6`

**3. `src/components/admin/DashboardCategoriesWidget.tsx`**
- Pe rândul categoriei (linia 160): adaug `min-w-0` și `overflow-hidden` pentru a preveni textul și badge-urile să depășească lățimea
- Pe butoanele din dreapta (linia 180): adaug `shrink-0` pentru a nu se comprima

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Padding responsive + overflow-x-hidden |
| `src/pages/admin/AdminDashboard.tsx` | min-w-0 pe flex items |
| `src/components/admin/DashboardCategoriesWidget.tsx` | min-w-0, shrink-0 pe layout |

