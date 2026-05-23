Pe `/categorie/:slug` scoatem tab-ul "Utilizatori" — pagina rămâne doar cu produse.

**`src/pages/CategoryDetail.tsx`**
- Eliminăm `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `activeTab`, `handleTabChange`, param `tab`.
- Eliminăm `useSearchUsers`, blocul de users și import-ul.
- Păstrăm bara de filtre (InlineSearchFilters + Sheet + view toggle) direct pe rândul de sus, lângă un titlu/contor de produse.
- Restul (banner, search, grid produse, empty state) rămâne identic.