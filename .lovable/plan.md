

## Plan: Rânduri clickabile pe pagina Admin Utilizatori

### Ce se schimbă

Exact ca la KYC: eliminăm coloana "Acțiuni" din tabel și facem rândurile clickabile. La click pe un utilizator, se deschide o pagină de detaliu dedicată cu toate opțiunile (schimbare rol, banare/debanare, profil public).

### Implementare

#### 1. Pagină nouă: `src/pages/admin/AdminUserDetail.tsx`
- Rută: `/admin/users/:id`
- Afișează informațiile complete ale utilizatorului (avatar, nume, email, telefon, dată înregistrare, KYC status, rol, status ban)
- Conține butoanele de acțiune: schimbare rol (Utilizator/Moderator/Admin), banare/debanare cu dialog de motivare, link spre profil public
- Folosește `fetchAdminUsers` cu search pe ID sau o funcție dedicată pentru a obține datele utilizatorului

#### 2. Modificare `src/pages/admin/AdminUsers.tsx`
- Eliminăm coloana "Acțiuni" din `TableHeader` și `TableBody`
- Eliminăm dropdown-ul cu meniul de acțiuni
- Adăugăm `className="cursor-pointer hover:bg-muted/50"` și `onClick={() => navigate(`/admin/users/${u.id}`)}` pe fiecare `TableRow`
- Eliminăm starea și logica de ban/role change (se mută în pagina de detaliu)
- Eliminăm dialogul de ban din această pagină

#### 3. Modificare `src/App.tsx`
- Adăugăm ruta `<Route path="/admin/users/:id" element={<AdminUserDetail />} />`
- Lazy import pentru `AdminUserDetail`

### Fișiere afectate
- **Creat**: `src/pages/admin/AdminUserDetail.tsx`
- **Modificat**: `src/pages/admin/AdminUsers.tsx`, `src/App.tsx`

