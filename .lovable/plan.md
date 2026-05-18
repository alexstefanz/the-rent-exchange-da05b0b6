## Obiectiv

Aliniază exact cardul de produs cu imaginea de referință pe Homepage („Închirieri populare"), pagina Favorite, Search, Category, Subcategory și pe oriunde altundeva e folosit `ProductCard`.

## Schimbări

### 1. `src/components/products/ProductCard.tsx` (varianta `gallery`)

- **Container card transparent**: elimină `bg-card` și `shadow-card` (și `hover:shadow-card-hover`). Cardul rămâne doar cu `rounded-xl`, `overflow-hidden`, focus pe imagine. Hover doar `hover:-translate-y-0.5`.
- **Badge categorie (stânga-sus pe imagine)** — exact ca în imaginea 2:
  - Pill alb `bg-white/95 rounded-full shadow-sm`, `pl-1 pr-2.5 py-1`, `gap-1.5`.
  - În stânga, un cerc mic portocaliu deschis (`bg-primary/15`) cu iconița `ShieldCheck` portocalie (`text-primary h-3.5 w-3.5`) — formează grupul "scut + nume categorie" într-un singur pill.
  - Text categorie `text-xs font-medium text-foreground`, `truncate max-w-[100px]`.
  - Elimină iconița `CheckCircle` flotantă separată.
- **Buton favorite (dreapta-sus)** — mai mare ca acum:
  - Cerc alb `h-9 w-9 bg-white/95 shadow-sm rounded-full`.
  - Inimă `h-[18px] w-[18px]`, contur `text-foreground/70` când nu e favorit, `fill-primary text-primary` când e.
- **Badge rating (dreapta-jos pe imagine)** — exact ca în imagine:
  - Pill alb `bg-white rounded-full px-2 py-0.5 shadow-sm`.
  - Stea galbenă mică plină + valoare bold negru (`text-foreground text-xs font-semibold`) + count în paranteze (`text-foreground/70 font-normal`).
- **Info sub imagine** (zonă fără background):
  - Padding redus la `pt-2 px-1 pb-1` (sau `p-2`), fără container alb.
  - Titlu: `text-sm md:text-[15px] font-semibold text-foreground line-clamp-1`.
  - Locație: pin mic + `text-xs text-muted-foreground truncate`, `mt-0.5`.
  - Preț: `text-foreground font-bold text-base`, urmat de `/ zi` în `text-xs text-muted-foreground`, `mt-1.5`.

### 2. `src/components/home/FeaturedListings.tsx`

Această secțiune are propriul JSX inline pentru carduri (nu folosește `ProductCard`). Trebuie aliniat 1-la-1 cu noul stil:

- **Header secțiune** — adaugă link „Vezi toate →" sus-dreapta:
  - `<div className="mb-6 flex items-end justify-between">` cu `<h2>` în stânga și `<Link to="/cauta">` în dreapta.
  - Link: `text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1` + `<ArrowRight className="h-4 w-4" />`.
  - Pe mobil link-ul rămâne tot în dreapta sus (același flex).
- **Elimină `SeeAllCard`** și nu-l mai adăuga în grid. Șterge componenta `SeeAllCard` și variabila `allImages`.
- **Grid**: păstrează `grid-cols-2 md:grid-cols-4 gap-4`. Acum încap toate cele 8 produse (mărește `slice(0, 7)` → `slice(0, 8)`).
- **Card inline**: rescrie identic cu noul stil din `ProductCard.gallery`:
  - Link fără `bg-card shadow-card` (transparent), doar `rounded-xl overflow-hidden hover:-translate-y-0.5`.
  - Badge categorie pill alb cu cerc `bg-primary/15` + `ShieldCheck` portocaliu + nume categorie (stânga-sus).
  - Heart `h-9 w-9` cerc alb cu inimă contur gri / plin portocaliu când favorit (fără fundal portocaliu pe buton).
  - Rating pill alb cu text negru și paranteze gri (jos-dreapta).
  - Info zonă: titlu `line-clamp-1`, locație mică, preț negru bold + `/ zi` gri. Fără `min-h` mare la titlu, fără background.

### 3. Verificare consum

- `src/components/profile/FavoritesTab.tsx`, `src/pages/Search.tsx`, `src/pages/CategoryDetail.tsx`, `src/pages/SubcategoryDetail.tsx`, `src/components/category/DiscoveryRails.tsx` — toate folosesc `ProductCard` și moștenesc automat noul stil. Nu sunt necesare modificări suplimentare acolo.

## Detalii tehnice

- În `ProductCard.tsx`: importă `ShieldCheck` din `lucide-react` (deja prezent), păstrează `CheckCircle` doar pentru ramura `list` dacă mai e folosit, altfel elimină.
- În `FeaturedListings.tsx`: înlocuiește `CheckCircle` cu `ShieldCheck` în imports, păstrează `ArrowRight` pentru link-ul „Vezi toate".
- Nu se schimbă props, API, queries, logică favorite/rating/i18n.

## Verificare

După implementare: `/` (Închirieri populare cu 8 carduri + link „Vezi toate →" sus-dreapta), `/favorite` și `/cauta` pentru consistență vizuală cu imaginea 1 și icoana detaliată din imaginea 2.