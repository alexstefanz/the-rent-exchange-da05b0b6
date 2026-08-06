# Hartă responsive stil Airbnb (tabletă + mobil)

## Ce se schimbă

Pe ecrane sub 1024px, vizualizarea Hartă din pagina de categorie trece de la split-screen (hartă lateral) la layout vertical, ca în referința Airbnb:

- **Hartă sus, mai mică:** ocupă aproximativ 45% din înălțimea ecranului (mobil) / 40% (tabletă), fixată sus în timp ce lista se derulează sub ea.
- **Listă dedesubt:** panou alb cu colțuri rotunjite, „grabber" (bara mică gri) și titlu centrat cu numărul de anunțuri, exact ca în imagine.
- **Grilă anunțuri:** 1 pe rând pe mobil (<640px), 2 pe rând pe tabletă (640–1023px), layoutul desktop rămâne neschimbat.
- Carouselul orizontal de carduri peste hartă și butonul de comutare Listă/Hartă dispar — nu mai sunt necesare, ambele sunt vizibile simultan.
- Marcatorii de preț rămân interactivi: click pe un marcaj derulează lista la anunțul respectiv și îl evidențiază; panoul de detaliu selectat rămâne funcțional, tot pe o coloană / două coloane pentru „restul anunțurilor".
- Paginarea (19 anunțuri/pagină) rămâne la fel, sub listă.

## Detalii tehnice

- `src/components/category/map/CategoryMapView.tsx`: se înlocuiește ramura `isMobile` (breakpoint 768) cu o ramură comună mobil+tabletă declanșată la `<1024px` (hook `useMediaQuery`/`matchMedia` pe `max-width: 1023px`), care randează `MapCanvas` într-un container `h-[45vh] md:h-[40vh] sticky top-16` urmat de `listPanel` derulabil.
- Se elimină carouselul orizontal absolut și butonul toggle `mobilePane`, împreună cu state-ul aferent.
- Grila din `listPanel` devine `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (deja e aproape așa; se validează că pe tabletă dă 2 coloane și pe mobil 1).
- `MapDetailPanel.tsx`: grila „restul anunțurilor" devine `grid-cols-1 sm:grid-cols-2`.
- Se păstrează `scrollbar-hide`, resetarea scroll-ului la schimbarea paginii și logica `handleSelect`.
