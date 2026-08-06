# Vizualizare hartă: scroll curat, hartă fixă, paginare 19/pagină

## Ce se schimbă

### 1. Bara de scroll ascunsă
Lista de produse din stânga (și caruselul mobil) rămâne scrollabilă, dar bara de scroll devine invizibilă (utilitar `.no-scrollbar` în `src/index.css`).

### 2. Harta fixă la scroll
Coloana hărții rămâne fixată în viewport cât timp derulezi lista: doar coloana listă are scroll intern, harta ocupă toată înălțimea ecranului și nu se mai mișcă.

### 3. Paginare — 19 produse pe pagină
- Lista afișează maximum 19 anunțuri per pagină.
- Sub grilă apare o paginare (Înapoi / numere / Înainte), bilingvă RO/EN.
- La schimbarea paginii lista se derulează sus, iar harta afișează pin-urile doar pentru anunțurile din pagina curentă.
- Paginarea se resetează la pagina 1 când se schimbă filtrele sau la „Caută în această zonă".

### 4. Layout „1 principal + 18 în două coloane"
La click pe un anunț (din listă sau de pe hartă):
- Anunțul selectat apare primul, pe lățime completă (imagine mare, preț, buton „Vezi anunțul").
- Sub el, celelalte 18 anunțuri din pagina curentă apar în grilă de 2 coloane, ordonate după apropierea față de anunțul principal.
- Hover pe oricare card evidențiază pin-ul corespunzător pe hartă.

## Detalii tehnice

- `src/index.css`: utilitar `.no-scrollbar` (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`).
- `src/components/category/map/CategoryMapView.tsx`:
  - `PAGE_SIZE = 19`, state `page`, `pagedProducts = visibleProducts.slice((page-1)*19, page*19)`;
  - `items` pentru `MapCanvas` derivate din `pagedProducts`;
  - reset `page` la schimbarea `products` / `areaBounds`;
  - clase `no-scrollbar` pe containerele cu scroll; coloana hărții cu înălțime fixă / `sticky`;
  - `similar` = restul de 18 din pagina curentă, sortate după distanță (în loc de 6).
- `src/components/category/map/MapDetailPanel.tsx`: randează cardul principal full-width plus grila de 2 coloane cu restul.
- Paginare inline cu butoane shadcn, fără dependențe noi.

Nu se modifică logica de business, RPC-urile sau datele — doar prezentarea.