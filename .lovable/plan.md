# Carduri hartă mai compacte, stil Airbnb

## Ce se schimbă

### Grilă anunțuri (mod hartă, desktop)
- 1920x1080 → 2 anunțuri pe rând (ca acum).
- Ultrawide 2560x1080 → 3 anunțuri pe rând.
- Pragul de 3 coloane se mută de la 1280px la ~2200px lățime ecran, ca panoul din dreapta (42% din viewport) să nu strivească cardurile pe 1920.

### Imagini mai mici / contained
- Raportul imaginii din card devine mai lat și mai scund (16/11 în loc de 20/19), deci cardul e vizibil mai scurt.
- Colțuri rotunjite mai mari și spațiere internă puțin redusă, textul rămâne pe 3 rânduri: titlu + rating, oraș · categorie, preț.

### Anunțul principal (selectat)
Se reface după exemplul din imagine:
- Card alb cu colțuri mari și umbră ușoară, cu padding în jurul conținutului.
- Layout orizontal: imaginea în stânga (aprox. 45% lățime, colțuri rotunjite, „contained" în interiorul cardului), detaliile în dreapta.
- Dreapta: titlu bold, descriere scurtă pe 1–2 rânduri, linia de locație, apoi preț subliniat + rating pe același rând.
- Buton inimă (favorite) în colțul dreapta-sus al cardului.
- Pe mobil/tabletă îngustă cardul revine la layout vertical (imagine sus, text jos).

## Detalii tehnice
- `src/components/category/map/CategoryMapView.tsx`: grila devine `grid-cols-2 min-[2200px]:grid-cols-3` (se elimină `xl:grid-cols-3`).
- `src/components/category/map/MapProductCard.tsx`: `aspect-[20/19]` → `aspect-[16/11]`, `rounded-xl` → `rounded-2xl`, mici ajustări de padding/typo.
- `src/components/category/map/MapDetailPanel.tsx`: `<article>`-ul principal se rescrie ca `flex flex-col sm:flex-row` cu imagine `sm:w-[45%] aspect-[4/3] rounded-2xl` și coloană de detalii; se păstrează linkurile către produs, textul de locație aproximativă și grila „similare" existentă.
- Fără modificări la fetch de date, paginare (19/pagină) sau logica hărții.
