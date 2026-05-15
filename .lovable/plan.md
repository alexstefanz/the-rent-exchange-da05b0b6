## Live category counts (homepage + Exploreaza)

### Problema

`Index.tsx` și `Categories.tsx` au fiecare propriul `useQuery(["category-counts"])` cu `staleTime: 5 * 60 * 1000`. Când publici/editezi un produs, contoarele rămân pe valoarea veche până expiră cache-ul. În plus, query-ul filtrează doar `is_active=true` și ignoră `approval_status`, deci poate număra produse `pending`/`rejected` în viitor.

### Soluție

1. **Hook partajat** `src/hooks/queries/useCategoryCounts.ts`:
   - Fetch din `products` cu `is_active=true` AND `approval_status='approved'`.
   - `staleTime: 60_000` (1 min) și `refetchOnMount: 'always'` ca fallback.
   - Subscribe Supabase Realtime pe `public.products` (`event: '*'`) și la fiecare change apelează `queryClient.invalidateQueries({ queryKey: ['category-counts'] })`. Cleanup `removeChannel` la unmount.
   - Returnează `Record<string, number>` (cheie = `category` name din DB).

2. **`src/pages/Index.tsx`** — înlocuiește `useQuery` inline cu `useCategoryCounts()`.

3. **`src/pages/Categories.tsx`** — înlocuiește `useQuery` inline cu `useCategoryCounts()`.

4. **Realtime publication** — verific dacă tabela `products` e deja în publicația `supabase_realtime`; dacă nu, migrare:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
   ```

### Ce NU se modifică

- Pagina `/categorie/:slug` (CategoryDetail) și search — au propriile query-uri pentru produse, deja reactive.
- Numele categoriilor / structura DB.
- Restul componentelor care consumă produse.

### Verificare

După publish-ul unui produs nou în Utilaje, contorul de pe homepage și `/categorii` se actualizează în câteva sute de ms (prin Realtime), fără refresh manual.