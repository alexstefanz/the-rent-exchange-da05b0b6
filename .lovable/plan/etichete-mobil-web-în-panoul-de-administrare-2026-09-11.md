# Etichete „Mobil / Web” în panoul de administrare

## Obiectiv
Fiecare anunț, rezervare și tichet primește o etichetă care arată de unde a fost creat: aplicația mobilă sau site-ul web. În panoul de administrare eticheta apare pe listă și se poate filtra după ea, ca să identifici rapid problemele care vin doar din aplicația mobilă.

## Cum funcționează
- La creare, sistemul reține automat sursa (mobil sau web). Nu se cere nimic utilizatorului.
- Înregistrările existente rămân marcate ca „Web”, pentru că nu avem informația retroactiv.
- În listele de Anunțuri, Rezervări și Tichete apare o etichetă mică: „Mobil” (portocaliu) sau „Web” (neutru).
- Lângă filtrele existente se adaugă un filtru „Sursă: Toate / Mobil / Web”.
- În paginile de detaliu (anunț, rezervare, tichet) sursa apare în zona de informații generale.

## Detalii tehnice
1. **Migrare bază de date**
   - Coloană nouă `created_via text not null default 'web'` cu constrângere `in ('web','mobile')` pe `products`, `rentals`, `ops_tickets`.
   - Index simplu pe fiecare coloană pentru filtrare rapidă.
   - Trigger `BEFORE INSERT` comun (`set_created_via()`) care citește antetul cererii `x-client-platform` din `request.headers` și setează `mobile` doar când antetul este `mobile`; altfel `web`. Valoarea trimisă de client în payload este ignorată (nu poate fi falsificată prin insert direct).

2. **Client mobil**
   - `mobile-template/lib/supabase.ts`: `createClient(..., { global: { headers: { "x-client-platform": "mobile" } } })`.

3. **RPC-uri admin**
   - `get_admin_products`, `get_admin_rentals` (și lista de tichete, care citește direct tabelul) trebuie să returneze `created_via`; se adaugă în `RETURNS TABLE` și în `SELECT`.
   - Se adaugă parametru opțional de filtrare `_created_via text default null` în cele două RPC-uri.

4. **Frontend admin**
   - Componentă nouă `src/components/admin/SourceBadge.tsx` (etichetă „Mobil” / „Web”, stil consecvent cu badge-urile existente).
   - Tipuri actualizate în `src/features/admin/adminApi.ts`, `adminProductsApi.ts`, `opsTicketsApi.ts` (+ `FetchTicketsFilters.created_via`).
   - Afișare și filtru în `AdminProducts.tsx`, `AdminReservations.tsx`, `AdminTickets.tsx` / `AdminInboxList.tsx`, plus etichetă în `AdminTicketDetail.tsx` și în detaliul rezervării/anunțului.

## Limitări
- Doar înregistrările create după implementare vor putea fi marcate „Mobil”.
- Dacă aplicația mobilă folosește un client propriu (nu `mobile-template`), trebuie adăugat același antet acolo, altfel apare tot ca „Web”.
