

# Traducere Categorii, Subcategorii si Pagini Detaliu

## Problema
Numele categoriilor (ex: "OUTDOOR & AVENTURA"), subcategoriilor (ex: "Castele gonflabile"), descrierilor si textele hardcoded din paginile `CategoryDetail.tsx` si `SubcategoryDetail.tsx` raman in romana indiferent de limba selectata.

## Solutia

### Pas 1: Adaugare campuri EN in `categories.ts`

Voi adauga `nameEn` si `descriptionEn` la interfetele `Category` si `Subcategory`, apoi voi completa traducerile pentru toate cele 22 categorii si ~150 subcategorii.

Exemplu:
```typescript
interface Subcategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  image: string;
}

interface Category {
  id: number;
  name: string;
  nameEn: string;
  subcategories: Subcategory[];
  icon: string;
}
```

Traduceri categorii:
| RO | EN |
|----|-----|
| OUTDOOR & AVENTURA | OUTDOOR & ADVENTURE |
| CAMPING & DRUMETII | CAMPING & HIKING |
| SPORTURI DE IARNA | WINTER SPORTS |
| SCULE, UNELTE & CONSTRUCTII | TOOLS & CONSTRUCTION |
| JUCARII GONFLABILE & COPII | INFLATABLES & KIDS |
| GAMING & ELECTRONICE | GAMING & ELECTRONICS |
| FOTO & VIDEO | PHOTO & VIDEO |
| MOBILITATE URBANA | URBAN MOBILITY |
| EVENIMENTE & HOBBY | EVENTS & HOBBY |
| INSTRUMENTE MUZICALE & DJ | MUSICAL INSTRUMENTS & DJ |
| FITNESS & WELLNESS | FITNESS & WELLNESS |
| ECHIPAMENTE MEDICALE & RECUPERARE | MEDICAL EQUIPMENT & RECOVERY |
| ANIMALE DE COMPANIE | PETS |
| REMORCI & TRANSPORT | TRAILERS & TRANSPORT |
| BEBE & FAMILY RENTALS | BABY & FAMILY RENTALS |
| IMPRIMANTE 3D & CNC | 3D PRINTERS & CNC |
| TELESCOP & OBSERVATIE | TELESCOPES & OBSERVATION |
| NUNTI & EVENIMENTE PREMIUM | WEDDINGS & PREMIUM EVENTS |
| COSTUME & RECUZITA | COSTUMES & PROPS |
| INDUSTRIAL CLEANING | INDUSTRIAL CLEANING |
| RULOTE & CAMPERVAN-URI | RVs & CAMPERVANS |

Plus toate ~150 subcategoriile cu `nameEn` si `descriptionEn`.

### Pas 2: Adaugare chei noi in `uxCopy.ts`

Voi adauga sectiunea `categoryDetail` cu traduceri pentru textele hardcoded:

```typescript
categoryDetail: {
  backToCategories: { ro: "Inapoi la Categorii", en: "Back to Categories" },
  subcategoriesAvailable: { ro: (n) => `${n} subcategorii disponibile pentru inchiriat`, en: (n) => `${n} subcategories available for rent` },
  listings: { ro: (n) => `${n} anunturi`, en: (n) => `${n} listings` },
  subcategories: { ro: "Subcategorii", en: "Subcategories" },
  listingsInCategory: { ro: "Anunturi in aceasta categorie", en: "Listings in this category" },
  noListings: { ro: "Nu exista anunturi in aceasta categorie momentan.", en: "No listings in this category at the moment." },
  addFirstListing: { ro: "Adauga primul anunt", en: "Add first listing" },
  categoryNotFound: { ro: "Categoria nu a fost gasita", en: "Category not found" },
  subcategoryNotFound: { ro: "Subcategoria nu a fost gasita", en: "Subcategory not found" },
  productsAvailable: { ro: (n) => `${n} produse disponibile pentru inchiriere`, en: (n) => `${n} products available for rent` },
  noProducts: { ro: "Nu exista produse disponibile in aceasta categorie momentan.", en: "No products available in this category at the moment." },
  addFirstProduct: { ro: "Adauga primul produs", en: "Add first product" },
  allSubcategories: { ro: "Toate subcategoriile", en: "All subcategories" },
  entireCountry: { ro: "Toata tara", en: "Entire country" },
  selectCity: { ro: "Selecteaza localitatea", en: "Select city" },
  allCities: { ro: "Toate localitatile", en: "All cities" },
  sortByPrice: { ro: "Sorteaza dupa pret", en: "Sort by price" },
  priceLowHigh: { ro: "Pret: Ieftin -> Scump", en: "Price: Low -> High" },
  priceHighLow: { ro: "Pret: Scump -> Ieftin", en: "Price: High -> Low" },
  backTo: { ro: (name) => `Inapoi la ${name}`, en: (name) => `Back to ${name}` },
}
```

### Pas 3: Actualizare `CategoryDetail.tsx`

- Import `useUxCopy` si `useLanguage`
- Folosire `language === "en" ? category.nameEn : category.name` pentru afisare
- Inlocuire texte hardcoded cu chei din `copy.categoryDetail`

### Pas 4: Actualizare `SubcategoryDetail.tsx`

- Import `useUxCopy` si `useLanguage`  
- Folosire `nameEn`/`descriptionEn` conditionate de limba
- Inlocuire texte hardcoded: "Inapoi la", "Se incarca...", "produse disponibile", "Nu exista produse", "Adauga primul produs", "Toata tara", etc.

### Pas 5: Actualizare `Categories.tsx`

- Pagina deja foloseste `useUxCopy`, dar afiseaza `category.name` - trebuie sa afiseze `nameEn` cand limba e EN

### Pas 6: Actualizare `SubcategoryCard.tsx`

- Va primi si `nameEn` si va afisa pe baza limbii

---

## Detalii Tehnice

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/data/categories.ts` | Adaugare `nameEn`, `descriptionEn` la toate categoriile si subcategoriile |
| `src/data/uxCopy.ts` | Adaugare sectiune `categoryDetail` |
| `src/pages/CategoryDetail.tsx` | Folosire traduceri dinamice |
| `src/pages/SubcategoryDetail.tsx` | Folosire traduceri dinamice |
| `src/pages/Categories.tsx` | Afisare `nameEn` cand limba e EN |
| `src/components/items/SubcategoryCard.tsx` | Afisare `nameEn` cand limba e EN |
| `src/pages/Index.tsx` | Afisare `nameEn` pe homepage categorii populare |

### Estimare
- ~150 subcategorii de tradus (name + description)
- 22 categorii de tradus
- 7 fisiere de modificat

