Categoria deja are RO + EN (nume). Subcategoria are RO + EN pentru nume, dar lipsește input-ul pentru descrierea în engleză (deși coloana `description_en` există în DB și e deja în state-ul formularului). Adaug câmpul lipsă și organizez clar dialogurile pe perechi RO/EN.

## Modificări — `src/pages/admin/AdminCategories.tsx`

**Dialog Categorie** (deja complet, doar reorganizat):
- Grup „Română": Nume (RO)
- Grup „English": Nume (EN)
- Icon + Ordine sortare

**Dialog Subcategorie** (adaug câmpurile lipsă):
- Grup „Română": Nume (RO), Descriere (RO) — `Textarea` în loc de `Input`
- Grup „English": Nume (EN), **Descriere (EN)** ← nou, leagă la `subForm.description_en` care există deja
- URL Imagine + Ordine sortare

## Note tehnice
- Nu sunt necesare modificări de schemă: `platform_categories.name_en` și `platform_subcategories.name_en` / `description_en` există deja.
- `categoriesApi` deja persistă toate aceste câmpuri (form-ul state-ul trimite payload complet).
- Înlocuiesc `Input` cu `Textarea` pentru descrieri (mai potrivit pentru text mai lung).
