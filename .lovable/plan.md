

## Plan: Adăugare coloană "Proprietar" în lista de rezervări

### Ce se schimbă

**Fișier: `src/pages/admin/AdminReservations.tsx`**

1. **Header tabel desktop** (linia 251-252): Adăugare `SortableTableHead` cu label "Proprietar" și sortKey "owner_name" după coloana "Chiriaș"

2. **Filtre coloane** (linia 166): Adăugare filtru text `{ key: "owner_name", type: "text", placeholder: "Proprietar..." }` după filtrul pentru chiriaș

3. **Celulă tabel desktop** (linia 275): Adăugare `<TableCell>{rental.owner_name}</TableCell>` după celula cu renter_name

4. **ColSpan** (linia 298): Actualizare `colSpan={6}` la `colSpan={7}` pentru rândul expandat

5. **Card-uri mobile** (linia 316): Adăugare owner_name în textul descriptiv: `{rental.renter_name} → {rental.owner_name}`

Nu sunt necesare modificări la baza de date — `owner_name` este deja returnat de funcția RPC `get_admin_rentals`.

