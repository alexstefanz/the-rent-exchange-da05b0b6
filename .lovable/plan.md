

## Plan: Înlocuire completă categorii și subcategorii

### Ce se schimbă
Înlocuim toate cele 20 de categorii existente cu 12 categorii noi și subcategoriile lor, conform listei tale. Produsele existente (~15) sunt remapate automat la noile categorii.

### Mapare produse existente → categorii noi

| Produs | Categorie veche | Categorie nouă | Subcategorie nouă |
|--------|----------------|-----------------|-------------------|
| autofiletanta cu impact | SCULE, UNELTE & CONSTRUCȚII / Scule electrice | Unelte | Scule electrice |
| Trusa universala | SCULE, UNELTE & CONSTRUCȚII | Unelte | Scule manuale |
| Inchiriez ciocan demolator | SCULE, UNELTE & CONSTRUCȚII | Unelte | Scule electrice |
| Ferestrau spada | SCULE, UNELTE & CONSTRUCȚII | Unelte | Scule electrice |
| Buldoexcavator / Manitou | SCULE, UNELTE & CONSTRUCȚII / Pompe de apă | Unelte | Construcții |
| Motosapa | SCULE, UNELTE & CONSTRUCȚII / Scule grădină | Grădinărit | Motounelte |
| Bicicleta (×2) | OUTDOOR & AVENTURĂ | Sport | Biciclete și accesorii |
| Playstation 5 | GAMING & ELECTRONICE / Console PlayStation | Electronice | Gaming |
| Laptop gaming | GAMING & ELECTRONICE / Laptopuri gaming | Electronice | Laptopuri și PC |
| Canon DSLR test | FOTO & VIDEO / DSLR | Electronice | Foto și video |
| Arcada nunta | NUNȚI & EVENIMENTE PREMIUM | Evenimente | Decor și lighting |
| Colivii decorative | NUNȚI & EVENIMENTE PREMIUM / Decoruri mari | Evenimente | Decor și lighting |
| Boxa portabila+2 microfoane | NUNȚI & EVENIMENTE PREMIUM | Evenimente | Echipamente audio-video |

### Fișiere de modificat

**1. `src/data/categories.ts`** — Rescrie complet array-ul `categories` cu cele 12 categorii noi și subcategoriile lor. Sluguri noi generate.

**2. `src/data/categoryIcons.ts`** — Noi asocieri id→icon Lucide pentru cele 12 categorii (Wrench, PartyPopper, Monitor, Flower2, TreePine, Castle, Dumbbell, Luggage, Truck, Shirt, Tractor, Package).

**3. `src/data/subcategoryIcons.ts`** — Rescrie complet maparea subcategorie→icon.

**4. DB: `platform_categories`** — Ștergere toate categoriile vechi, inserare 12 noi.

**5. DB: `platform_subcategories`** — Ștergere toate subcategoriile vechi, inserare cele ~65 noi cu referințe la categoriile părinte.

**6. DB: `products`** — UPDATE pe fiecare produs cu noua categorie și subcategorie conform tabelului de mai sus.

### Pași execuție
1. Rescriu `categories.ts`, `categoryIcons.ts`, `subcategoryIcons.ts`
2. Curăț și repopulez `platform_categories` + `platform_subcategories` în DB
3. Rulez UPDATE-uri pe produsele existente pentru a le remapa
4. Verific că paginile Categories, CategoryDetail și formularul de produs funcționează cu noile date

