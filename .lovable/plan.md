# Redirecționare buton „Proprietar” către închirierile active și adăugare istoric încheiat

## Context
În meniul contului (`AccountHubMenu`), butonul mare „Proprietar” duce în prezent spre `/anunturi` (Anunțurile mele). Utilizatorul vrea ca acesta să ducă spre închirierile active ca proprietar, iar imediat sub el să existe o intrare pentru închirierile încheiate ca proprietar.

## Ce se va modifica

### 1. `src/components/layout/AccountHubMenu.tsx`
- Butonul „Proprietar” va naviga la `/inchirieri?status=active` în loc de `/anunturi`.
- Subtitlul va fi actualizat pentru a reflecta închirierile active (cereri + închirieri în derulare).
- Se adaugă un nou buton sub acesta: „Închirieri încheiate” → `/inchirieri?status=completed`.
- Butonul nou va afișa un badge cu numărul de închirieri finalizate ca proprietar, dacă este disponibil.

### 2. `src/hooks/useAccountDashboard.ts`
- Se adaugă semnal `completedRentalsAsOwner` (număr de închirieri `completed` unde `owner_id = uid`), pentru a putea afișa badge pe noul buton.

### 3. `src/pages/OwnerRentalsPage.tsx` + `src/components/dashboard/RentalsOutTab.tsx`
- Se citește query-param-ul `status` (ex. `?status=active`, `?status=completed`).
- Filtrul implicit din `RentalsOutTab` va fi sincronizat cu parametrul URL, astfel încât pagina să deschidă direct secțiunea dorită.
- Titlul și descrierea paginii se vor adapta în funcție de filtrul activ (ex. „Închirieri active” vs. „Închirieri încheiate”).

### 4. `src/components/layout/mobile-drawer/DrawerQuickActions.tsx`
- Cardul „cereri (proprietar)” va naviga la `/inchirieri?status=active` pentru consistență cu noul comportament din `AccountHubMenu`.
- Cardul „anunțurile mele” va rămâne la `/anunturi`, deoarece utilizatorul a cerut doar redirectarea butonului „Proprietar” și adăugarea istoricului, nu eliminarea accesului la anunțuri.

## Criterii de acceptare
- Click pe butonul „Proprietar” din meniul contului deschide `/inchirieri?status=active`.
- Sub butonul „Proprietar” există un nou buton „Închirieri încheiate” care deschide `/inchirieri?status=completed`.
- Pagina `/inchirieri` aplică automat filtrul corespunzător query-param-ului.
- Accesul la `/anunturi` rămâne disponibil prin alte căi existente (ex. profil / navigație secundară).
