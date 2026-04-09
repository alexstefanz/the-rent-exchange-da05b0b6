

## Plan: Afișare toate cele 12 categorii pe homepage

### Problema
Linia 50 din `src/pages/Index.tsx` filtrează categoriile folosind ID-uri vechi (`[1, 2, 6, 7, 22, 19, 4, 5, 9, 3, 10, 11]`), din care `22` și `19` nu mai există. Rezultă că doar 10 categorii apar, iar "Travel" (8) și "Diverse" (12) lipsesc.

### Soluție
Eliminăm filtrarea — afișăm direct toate categoriile din array-ul `categories` (care are exact 12 elemente).

### Modificare: `src/pages/Index.tsx`
- **Ștergem** liniile 50-51 (`popularCategoryIds` și `popularCategories`)
- **Înlocuim** `popularCategories.map(...)` cu `categories.map(...)`

O singură modificare, un singur fișier.

