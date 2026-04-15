

## Plan: Fix mobile overflow pe cardurile Rezervări și Categorii

### Problema
Pe mobil (390px), conținutul din cardurile "Ultimele Rezervări" și "Categorii" depășește lățimea cardului. Badge-urile ("În aștept...") și prețurile ("600 R...") sunt tăiate pe dreapta. Cauza: `CardHeader` și `CardContent` au `p-6` (24px padding) care pe un ecran de 390px cu `p-4` exterior lasă foarte puțin spațiu util, iar elementele flex din interior nu au `min-w-0` / `overflow-hidden` corect.

### Modificări

**1. `src/pages/admin/AdminDashboard.tsx`**
- Pe `Card` (Ultimele Rezervări): adaug `overflow-hidden`
- Pe `CardHeader` și `CardContent`: padding responsive `p-4 md:p-6` / `p-4 pt-0 md:p-6 md:pt-0`
- Pe fiecare rental item (linia 148-168): adaug `min-w-0` pe ambele div-uri copil (stânga și dreapta), `shrink-0` pe div-ul dreapta, `truncate` pe text

**2. `src/components/admin/DashboardCategoriesWidget.tsx`**
- Pe `Card`: adaug `overflow-hidden`  
- Pe `CardHeader` și `CardContent`: padding responsive `p-4 md:p-6` / `p-4 pt-0 md:p-6 md:pt-0`
- Pe rândurile de categorii: `overflow-hidden` pe container

**3. `src/pages/admin/AdminDashboard.tsx` — grid wrapper**
- Pe `grid gap-6 lg:grid-cols-2` (linia 124): adaug `min-w-0` pe copii cu `[&>*]:min-w-0`

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Padding responsive pe Card, min-w-0, overflow-hidden, truncate pe rental items |
| `src/components/admin/DashboardCategoriesWidget.tsx` | Padding responsive, overflow-hidden pe Card |

