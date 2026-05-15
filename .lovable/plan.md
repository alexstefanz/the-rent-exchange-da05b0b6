## Sincronizare categorii homepage cu admin (DB)

Actualizez fișierul static `src/data/categories.ts` și mapping-ul de iconițe pentru a se potrivi exact cu `platform_categories` din DB (sursa pe care o modifici din Admin).

### Schimbări — `src/data/categories.ts`

| ID | Nume curent | Nume nou (din DB) |
|----|---|---|
| 5 | `name: "Outdoor"` | `name: "Drumeții & Natură"` (nameEn rămâne `"Outdoor"`) |
| 8 | `name: "Travel"`, `nameEn: "Travel"` | `name: "Călătorii"`, `nameEn: "Travel"` |
| 11 | `name: "Utilaje"`, `nameEn: "Heavy Equipment"` (sau similar) | `name: "Echipamente Agricole"`, `nameEn: "Agricultural Equipment"` |

Slug-urile rămân neschimbate (pentru a nu strica URL-uri/SEO existente: `/categorie/outdoor`, `/categorie/travel`, `/categorie/utilaje`).

### Schimbări — `src/data/categoryIcons.ts`

- ID 11: `Forklift` → `Tractor` (import din `lucide-react`).
- ID 5 (`TreePine`) și ID 8 (`Luggage`) sunt deja corecte.

### Ce NU se modifică

- DB / migrări (ai ales sincronizare statică).
- Slug-urile categoriilor și rutele.
- Restul celor 9 categorii (deja identice).
- `productI18n.ts` — folosește map-ul derivat din `categories.ts`, deci se actualizează automat.

### Verificare

După modificări, homepage-ul va afișa: Unelte, Evenimente, Electronice, Grădinărit, **Drumeții & Natură**, Jucării și Petrecere Copii, Sport, **Călătorii**, Transport și Utilitare, Haine și Recuzită, **Echipamente Agricole** (icon Tractor), Diverse — identic cu admin.