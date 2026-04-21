

## Plan: Redenumire categorie "Echipamente Agricole" → "Utilaje" + subcategorii noi

### Context
Categoria curentă `id: "11"` "Echipamente Agricole" conține 6 subcategorii agricole (tractoare, prelucrare sol, semănat, irigare, recoltare, atașamente). Vrei să o redenumești în "Utilaje" și să adaugi 7 subcategorii noi de utilaje de construcții/ridicare.

### Decizie de structură
Păstrez subcategoriile agricole existente (sunt deja folosite de produse) și **adaug cele 7 noi**, astfel încât categoria "Utilaje" să acopere atât utilaje agricole, cât și de construcții. Dacă preferi să elimin complet subcategoriile agricole, spune-mi.

### Modificări

**1. `src/data/categories.ts`** — categoria `id: "11"`
- `name`: "Echipamente Agricole" → **"Utilaje"**
- `nameEn`: "Agricultural Equipment" → **"Heavy Equipment"**
- `slug`: "echipamente-agricole" → **"utilaje"**
- Adaug 7 subcategorii noi cu ID-uri `11-7` … `11-13`:

| ID | Nume RO | Nume EN |
|---|---|---|
| 11-7 | Buldoexcavator | Backhoe Loader |
| 11-8 | Excavator | Excavator |
| 11-9 | Cilindru Compactor | Road Roller |
| 11-10 | Macara | Crane |
| 11-11 | Nacelă Articulată | Articulated Boom Lift |
| 11-12 | Nacelă Foarfecă | Scissor Lift |
| 11-13 | Încărcător Frontal | Front Loader |

Fiecare subcategorie primește: `slug`, `description` RO/EN, `image` (placeholder Unsplash realist cu utilajul respectiv).

**2. `src/data/subcategoryIcons.ts`** — iconițe pentru noile subcategorii
- `11-7` Buldoexcavator → `Construction` (Lucide)
- `11-8` Excavator → `Shovel`
- `11-9` Cilindru Compactor → `CircleDot`
- `11-10` Macara → `ArrowUpFromLine` sau `ConstructionIcon`
- `11-11` Nacelă Articulată → `MoveUp`
- `11-12` Nacelă Foarfecă → `ChevronsUp`
- `11-13` Încărcător Frontal → `Truck` / `Forklift`

(Voi alege icoane Lucide existente potrivite vizual.)

**3. Redirect pentru URL vechi** (opțional, dar recomandat pentru SEO)
- În `src/pages/CategoryDetail.tsx`: dacă slug-ul accesat este `echipamente-agricole`, redirectez automat la `/categorie/utilaje` (`<Navigate replace>`)
- Astfel link-urile externe / bookmarks vechi rămân funcționale

### Migrare date existente
Categoria nu este referențiată în DB după ID numeric — produsele folosesc string-ul `category` din `products.category`. **Nu este necesară migrare SQL** dacă nu există produse publicate cu `category = "Echipamente Agricole"`.

Dacă există astfel de produse, voi adăuga o migrare SQL: `UPDATE products SET category = 'Utilaje' WHERE category = 'Echipamente Agricole';` — voi verifica și rula doar dacă găsesc rânduri.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/data/categories.ts` | Redenumire categorie `11` + 7 subcategorii noi |
| `src/data/subcategoryIcons.ts` | 7 mapări noi de iconițe |
| `src/pages/CategoryDetail.tsx` | Redirect `echipamente-agricole` → `utilaje` |
| Migrare SQL (condițional) | Update `products.category` dacă există date vechi |

