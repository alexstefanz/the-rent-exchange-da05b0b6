
# Fix 404 pe "View request" + Anulare cerere in 24h

## Problema 1: Butonul "View request" duce la 404
Butonul "View request" din ecranul de confirmare navigheaza catre `/profil#mesaje`, dar ruta corecta in aplicatie este `/profile`. Simpla corectare a linkului rezolva problema.

## Problema 2: Anulare cerere de catre chirias (max 24h)
Chiriasul trebuie sa poata anula o cerere de inchiriere pending, dar doar in primele 24 de ore de la creare. Dupa 24h, butonul de anulare dispare.

---

## Ce se schimba

### 1. Fix link "View request" (`BookingConfirmation.tsx`)
- Schimbam `/profil#mesaje` in `/profile?tab=rentals` pentru a duce chiriasul direct la tab-ul cu cererile lui

### 2. Buton "Anuleaza cererea" in `RentalsTab.tsx`
- Pentru inchirierile cu status `pending` si create in ultimele 24h, afisam un buton "Anuleaza cererea"
- La click, se cere confirmare si apoi se actualizeaza statusul in `cancelled`
- Fetch-ul deja include `created_at` implicit; vom adauga `created_at` in query si in interfata `Rental`
- Folosim update direct pe tabela `rentals` (RLS permite renter-ului? - trebuie verificat)

### 3. RLS Policy pentru anulare de catre chirias
- In prezent, doar owner-ul si admin-ul pot face UPDATE pe `rentals`
- Trebuie adaugata o politica RLS care permite renter-ului sa faca update (doar pe `status` si `cancelled_at`) pentru propriile cereri pending

---

## Detalii tehnice

### Migrare DB
```sql
CREATE POLICY "Renters can cancel own pending rentals"
ON public.rentals FOR UPDATE
USING (renter_id = auth.uid() AND status = 'pending')
WITH CHECK (renter_id = auth.uid() AND status = 'cancelled');
```

### BookingConfirmation.tsx
- Linia 81: `/profil#mesaje` -> `/profile?tab=rentals`

### RentalsTab.tsx
- Adaugam `created_at` in query-ul Supabase si in interfata
- Pentru cereri `pending` create in ultimele 24h, afisam buton "Anuleaza"
- La click: dialog de confirmare, apoi `supabase.from("rentals").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", rentalId)`
- Invalidam query-ul dupa anulare

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/components/booking/BookingConfirmation.tsx` | Fix link: `/profile?tab=rentals` |
| `src/components/dashboard/RentalsTab.tsx` | Buton anulare + logica 24h |
| DB migration | RLS policy pentru renter cancel |
