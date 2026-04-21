

## Plan: Schimbare imagine categorie "Transport și Utilitare"

### Context
Pagina `/categorie/transport-utilitare` afișează în hero un banner cu o imagine de fundal preluată din `categories.ts` (sau din prima subcategorie). Imaginea curentă nu reprezintă vizual o mașină de transport.

### Soluție
Înlocuiesc imaginea de fundal a categoriei "Transport și Utilitare" cu o fotografie realistă a unei dube/mașini de transport (van comercial, gen Ford Transit / Mercedes Sprinter), conform regulii de fotografie realistă (fără AI/animat).

### Pași tehnici

1. **Generez/aleg o imagine realistă** de mașină de transport utilitar (dubă albă comercială pe fundal neutru) și o salvez la `public/images/categories/transport-utilitare.webp` (format WebP pentru performanță)

2. **Actualizez `src/data/categories.ts`** — câmpul `image` al categoriei `transport-utilitare` (sau al primei subcategorii afișate ca background, în funcție de logica curentă din `CategoryDetail.tsx`) va trimite la noua imagine

3. **Verific `src/pages/CategoryDetail.tsx`** pentru a confirma de unde citește imaginea hero (din `category.image` direct sau din `subcategories[0].image`) și ajustez sursa corectă

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `public/images/categories/transport-utilitare.webp` (nou) | Imagine realistă cu dubă/utilitară |
| `src/data/categories.ts` | Update path imagine pentru categoria `transport-utilitare` |

### Notă
Folosesc o imagine de stoc realistă (nu generată AI), respectând regula de brand pentru fotografie autentică profesională.

