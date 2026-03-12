

## Modificari profile mobile

### 1. BalanceCard — ascunde cardul Notificari pe mobil (4 carduri in grid 2x2)

In `src/components/profile/BalanceCard.tsx`:
- Import `useIsMobile` hook
- Ascunde cardul Notificari pe mobil (`!isMobile` condition pe ultimul DashboardCard)
- Grid-ul ramane `grid-cols-2` pe mobil = 4 carduri (Balanta, Favorite, Mesaje, Recenzii) in 2x2 perfect
- Skeleton loading: afiseaza 4 pe mobil, 5 pe desktop

### 2. TabsList — grid 2x2 cu width-uri egale pe mobil

In `src/pages/Profile.tsx`:
- Schimb TabsList din `flex flex-wrap` in `grid grid-cols-2` pe mobil
- Fiecare TabsTrigger primeste `w-full` pentru a umple celula
- Pe desktop ramane flex normal

Doua fisiere modificate.

