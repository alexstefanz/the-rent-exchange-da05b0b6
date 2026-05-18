## Obiectiv

Aliniază aspectul cardului de produs cu exemplul din imagine, pe toate paginile care îl folosesc (Homepage „Închirieri populare", Favorite, Search, Category, Subcategory, DiscoveryRails).

## Schimbări vizuale în `src/components/products/ProductCard.tsx`

Toate modificările sunt în varianta `gallery` (cea principală). Varianta `list` rămâne neschimbată.

1. **Badge de categorie (stânga-sus pe imagine)**
   - Mutat din zona de info peste imagine, în colțul stânga-sus.
   - Pill alb (`bg-white/95`), text închis (`text-foreground`), shadow subtil, `rounded-full`, padding `px-2.5 py-1`.
   - Prefix cu iconiță scut mic portocaliu (`ShieldCheck` din lucide, `text-primary`, `h-3.5 w-3.5`) urmat de numele categoriei (`text-xs font-medium`).
   - Înlocuiește actualul `CheckCircle` flotant separat (se elimină).

2. **Buton favorite (dreapta-sus)**
   - Cerc alb mai mare (`h-8 w-8`), `bg-white/95`, shadow subtil.
   - Inimă goală gri (`text-muted-foreground`) când nu e favorit; portocaliu plin (`fill-primary text-primary`) când e favorit. Fără fundal portocaliu pe buton.

3. **Badge rating (dreapta-jos pe imagine)**
   - Fără fundal negru. Pill alb compact (`bg-white/95 rounded-full px-2 py-0.5 shadow-sm`).
   - Stea galbenă mică + valoare bold + count în paranteze, text închis (`text-foreground text-xs`).

4. **Zona de info sub imagine**
   - Elimină badge-ul de categorie din această zonă (a urcat pe imagine).
   - Titlu: `text-sm md:text-base font-semibold`, `line-clamp-1`, fără `min-h` mare — card mai compact.
   - Rând locație: pin mic + text `text-xs text-muted-foreground truncate`, marginea redusă (`mt-1`).
   - Preț: `text-foreground` (negru, nu portocaliu), `font-bold text-base md:text-lg`, urmat de `/ zi` în `text-xs text-muted-foreground`. Margine `mt-2`.

5. **Container card**
   - Păstrează `rounded-xl`, `bg-card`, `shadow-card`, hover lift.
   - Padding info redus la `p-3` pentru densitate similară referinței.

## Detalii tehnice

- Import nou: `ShieldCheck` din `lucide-react`; păstrează `Heart`, `Star`, `MapPin`; elimină `CheckCircle` dacă nu mai e folosit în acest fișier.
- Nu se schimbă props, API sau logică (favorite, rating fetch, i18n). Doar JSX + Tailwind classes în ramura `gallery`.
- Nu se ating: `RentalProductCard`, `ProductCardSkeleton` (skeleton-ul rămâne compatibil dimensional), paginile consumatoare.

## Verificare

După modificare, vizitează `/` (secțiunea „Închirieri populare") și `/profile` → tab Favorite, plus o pagină de categorie, pentru a confirma că noul layout se aplică uniform și că rating-ul/favorite/categoria se afișează corect.
