# Mod Hartă full-width, stil Airbnb

Harta devine un layout pe toată lățimea ecranului, cu listă în stânga și hartă fixă în dreapta, exact ca la Airbnb — inclusiv stilul hărții și felul în care arată cardurile de produs.

## Ce se schimbă vizual

**Layout full-width (desktop)**
- În modul Hartă, conținutul iese din `container` și ocupă toată lățimea ferestrei.
- Bara de filtre + toggle-ul Hartă/Grid/Listă rămân sus, sticky, pe toată lățimea.
- Hero-ul de categorie se ascunde în modul Hartă (ca la Airbnb, unde harta începe imediat sub filtre), astfel încât harta să ocupe tot ecranul sub bară.
- Stânga: listă scrollabilă (~58%) cu carduri pe 2 coloane; dreapta: harta lipită de marginea dreaptă, înălțime completă, fără colțuri rotunjite/spațiu alb, cu scroll propriu doar pentru listă.
- Footer-ul nu apare în modul hartă (ecran de tip aplicație).

**Design hartă (stil Airbnb)**
- Stil personalizat Google Maps: fundal deschis, drumuri albe/gri subtile, apă albastru-pal, parcuri verde-pal, POI-uri ascunse, etichete discrete.
- Pastile de preț albe cu text negru, umbră fină, colțuri complet rotunjite; la hover — ușor scale-up; activ/selectat — fundal negru cu text alb (accent Rentli pe cardul selectat).
- Pastilele de anunțuri deja vizitate/selectate rămân marcate.
- Controale zoom +/- rotunjite, în colțul dreapta-sus, stil Airbnb; buton „Caută în această zonă" centrat sus când harta e mutată.
- Clusterele devin cercuri albe cu număr, în același stil.

**Carduri produs în stil Airbnb**
- Card fără chenar și fără fundal: imagine cu colțuri rotunjite (aspect 20/19), inimă favorit în colțul dreapta-sus peste imagine, indicatori de galerie (puncte) jos.
- Sub imagine: titlu bold pe un rând, oraș/subcategorie gri, apoi prețul bold + „/ zi", iar rating-ul aliniat la dreapta pe rândul titlului.
- Hover pe card evidențiază pastila de preț de pe hartă și invers (comportament păstrat).
- Acest stil se aplică doar în modul Hartă (o variantă nouă a cardului), ca să nu schimbe grid-ul/lista existente.

**Mobil**
- Harta pe tot ecranul, edge-to-edge, cu carusel orizontal de carduri Airbnb jos peste hartă și buton pill „Listă / Hartă" flotant.

## Detalii tehnice

- `src/pages/CategoryDetail.tsx`: în `viewMode === "map"` se randează un layout în afara `container`-ului (full-bleed), se ascunde `CategoryHero` și footer-ul; bara de filtre primește `sticky top-16`.
- `src/components/category/map/CategoryMapView.tsx`: grid `[minmax(0,58%)_1fr]`, `h-[calc(100vh-var(--header))]`, listă cu scroll propriu, hartă fără border/rounded.
- `src/components/category/map/MapCanvas.tsx`: array nou `styles` (paletă Airbnb-like), `zoomControl` custom, buton „Caută în această zonă".
- `src/components/category/map/priceMarker.ts`: pastile SVG albe/negre cu umbră, stări `default | hover | active | visited`; cluster ca cerc alb.
- Componentă nouă `src/components/category/map/MapProductCard.tsx` pentru cardul stil Airbnb (folosită în listă, panoul de detaliu și caruselul mobil).
- Fără schimbări de backend: aceleași RPC-uri `get_products_map_points` și logica de preț `calculateClientPrice`.
