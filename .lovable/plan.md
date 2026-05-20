## Simplificare pagină „Produsele mele / Cereri primite"

### 1. Header compact (înlocuiește cardul mare „Produsele mele")
În `src/pages/ListingsPage.tsx`:
- Elimin componenta `<ListingsHeader />` (cardul mare cu „Ca proprietar / Produsele mele / Gestionează cele X anunțuri…").
- Deasupra `TabsList` „Anunțuri / Cereri primite" pun un rând mic:
  - Stânga: titlu mic „Produsele mele" / „My listings" (`text-sm font-semibold text-muted-foreground uppercase tracking-wide` sau similar discret) + subtitlu opțional într-o linie mică.
  - Dreapta: butonul `+ Adaugă produs` (link către `/owner/new-product`), vizibil pe desktop. Pe mobil rămâne CTA-ul sticky existent (fără dublare).
- Rândul devine `flex items-center justify-between`, fără card / border / shadow.

### 2. Eliminare carduri statistici, mutare în tab-uri filtre
- Elimin `<ListingsStatsBar />` din pagina de anunțuri.
- În `Tabs` cu filtre status (`Toate / Active / În verificare / Ascunse / Respinse`):
  - Păstrez badge-urile cu count-uri existente.
  - Adaug un nou trigger „Cereri noi" / „New requests" cu badge `stats.new_requests`, dar care NU este un status filter — la click setează tabul de sus pe `cereri` (apelează `setTopTab("cereri")`), exact ca acțiunea fostului card.
  - Implementare: folosesc `onClick` pe `TabsTrigger` care previne schimbarea valorii (sau îl scot din `Tabs` și îl randez ca buton stilizat identic cu celelalte triggers folosind aceleași clase Tailwind, ca să nu lupt cu Radix).

### 3. Filtre: elimin dropdown „Toate orașele"
În `src/components/listings/ListingsFilterBar.tsx`:
- Elimin selectul de orașe și prop-ul `cities` (sau îl ignor).
- În `ListingsPage.tsx` nu mai trec `cities`; păstrez state-ul `filters.city` ca `"all"` permanent (sau scot câmpul din interfață) — pentru zero risc, las câmpul în tip dar fără UI și fără filtrare după el (sau scot complet referința la `city` din `filtered`).

### Fișiere modificate
- `src/pages/ListingsPage.tsx` — header nou, fără StatsBar, tab nou „Cereri noi", fără `cities`.
- `src/components/listings/ListingsFilterBar.tsx` — fără dropdown oraș.
- (Opțional) `src/components/listings/ListingsHeader.tsx` și `ListingsStatsBar.tsx` rămân în repo dar nu mai sunt importate; le pot șterge dacă vrei.

### Nu se schimbă
- Logica de date (`useMyProducts`, `useOwnerListingsStats`, realtime).
- Tabul `Cereri primite` și conținutul lui.
- CTA mobile sticky.

Vrei să șterg și fișierele `ListingsHeader.tsx` + `ListingsStatsBar.tsx` rămase neutilizate?
