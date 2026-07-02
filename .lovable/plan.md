## Obiectiv
Înlocuiesc `public/og-image.webp` (featured image partajat pe rețele sociale) cu o variantă în stilul imaginii de referință, dar cu tipografie curată, fără litere distorsionate.

## Design
- **Fundal**: portocaliu solid `#F59E0B` (culoarea primară Rentli, ca în referință).
- **Stânga**: logo-ul oficial Rentli (SVG/PNG transparent existent în proiect) redat MARE, alb, fără redesenare cu PIL — folosesc direct asset-ul din brand pentru a evita orice distorsiune a literelor.
- **Sub logo**: sloganul „Închiriază orice, oriunde în România" în Plus Jakarta Sans (fontul brandului), alb, dimensiune moderată, o singură linie.
- **Dreapta**: colaj cu 4 cercuri albe conținând poze reale de produse (bormașină, cort, bicicletă, aparat foto) — identic ca aranjament cu referința.
- **Dimensiuni**: 1200×630 (standard OG / Twitter card).

## Implementare
1. Localizez logo-ul Rentli existent (SVG transparent) în `src/assets` / `public`.
2. Generez cele 4 poze de produs pe fundal alb rotund cu `imagegen--edit_image` sau reutilizez imagini existente din categorii.
3. Compun imaginea finală cu un script Python (PIL) care:
   - desenează fundal portocaliu,
   - lipește logo-ul PNG neatins (fără rasterizare a textului din cod → zero distorsiune),
   - scrie sloganul cu fontul Plus Jakarta Sans descărcat de la Google Fonts,
   - lipește cele 4 cercuri cu produse în dreapta.
4. Salvez la `public/og-image.webp` (înlocuiește fișierul curent, păstrând referințele din `index.html`).
5. QA vizual: deschid rezultatul, verific că literele „Rentli" sunt intacte, sloganul citibil, produsele aliniate.

## Ce NU se schimbă
- Meta tag-urile OG din `index.html` rămân neschimbate (același nume de fișier).
- Nicio modificare de cod în componente.
