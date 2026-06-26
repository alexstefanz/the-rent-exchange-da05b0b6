Adaugă un buton de back fix pe mobil pentru paginile de categorie și produs.

## Context
- Pagina de produs are deja un buton de back încorporat în galeria mobilă (`ProductImageGallery`), dar utilizatorul vrea un buton fix pe ecran, în stânga-sus, vizibil în timpul scroll-ului.
- Pagina de categorie nu are deloc buton de back mobil.
- Navbar-ul este fix (`fixed`) pe mobil, deci butonul trebuie poziționat sub el.

## Ce se construiește
1. **Componentă reutilizabilă** `src/components/shared/MobileFixedBackButton.tsx`:
   - Iconiță `ArrowLeft` (lucide-react).
   - Buton circular cu fundal semi-transparent întunecat (`bg-black/40 backdrop-blur-sm`) și iconiță albă, pentru a fi vizibil pe orice fundal.
   - Poziționat fix (`fixed`) în stânga-sus: `top-20 left-4` (sub navbar de 64px), cu `z-[40]` și `lg:hidden`.
   - Acțiune: `navigate(-1)`; fallback la `/` dacă nu există istoric.

2. **Pagina de categorie** `src/pages/CategoryDetail.tsx`:
   - Adaugă `<MobileFixedBackButton />` imediat după `<Navbar />`.

3. **Pagina de produs** `src/pages/ProductDetail.tsx`:
   - Adaugă `<MobileFixedBackButton />` imediat după `<Navbar />`.
   - Elimină prop-ul `onBack` de la apelul variantei mobile a `<ProductImageGallery>` pentru a evita dublarea butonului.

## Nu se modifică
- Componenta `ProductImageGallery` rămâne neschimbată; paginile care încă folosesc `onBack` (ex. `ProductPreview`) își păstrează comportamentul existent.
- Nu se adaugă buton de back pe desktop.

## Verificare
- Prevualizare mobilă pe pagina de categorie și pagina de produs: butonul trebuie să apară în stânga-sus, sub navbar, și să rămână fix la scroll.