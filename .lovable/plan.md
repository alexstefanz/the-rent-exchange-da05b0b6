# Verificare: căutare pe hartă după cuvânt cheie

## Concluzia verificării

Funcționalitatea cerută **există deja și funcționează** — nu este nevoie de nicio modificare obligatorie.

Ce am confirmat în cod:

1. **Pagina de căutare (`/cauta`)** — modul Hartă este implicit. Când utilizatorul scrie „xbox", lista de anunțuri este filtrată după cuvântul cheie (prin RPC-ul `search_products`, insensibil la diacritice), iar harta primește exact aceeași listă filtrată. Pinurile de pe hartă sunt generate doar pentru ID-urile produselor filtrate (`useProductsMapPoints` primește ID-urile listei), deci pe hartă apar **doar** anunțurile care conțin cuvântul căutat, în aria lor de proximitate.

2. **Pagina de categorie (`/categorie/:slug`)** — la fel: harta afișează doar rezultatele filtrate. Bonus: când există un cuvânt cheie, căutarea se face în toate categoriile (cu banda de context „Rezultate pentru «xbox» din toate categoriile" + buton „Caută doar în {categorie}").

3. **Zero rezultate** — harta rămâne vizibilă fără pinuri, iar panoul afișează mesajul „Niciun anunț pentru «xbox»" cu sugestii de termeni apropiați și buton „Șterge căutarea".

## Îmbunătățiri opționale (doar dacă le dorești)

- **Test vizual în preview** cu un cuvânt cheie real (ex. „xbox") pentru confirmare pe date live.
- Nimic altceva nu lipsește față de comportamentul descris în cerință.

## Detalii tehnice

- `src/pages/Search.tsx`: `filteredProducts` (deja filtrat după `q`, județ, localitate, preț) este pasat către `CategoryMapView`.
- `src/hooks/queries/useProductsMapPoints.ts`: cere coordonatele aproximative doar pentru ID-urile din lista filtrată.
- `src/pages/CategoryDetail.tsx`: același mecanism, plus `restrictToCategory` pentru limitarea la categorie.
