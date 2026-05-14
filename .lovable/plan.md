## Problema
În cardurile de produs (ex. "Închirieri populare"), când titlul are 1 rând prețul urcă, iar când are 2 rânduri prețul coboară — preturile nu se aliniază pe orizontală între carduri.

## Soluție
Forțăm titlul să rezerve mereu spațiu pentru 2 rânduri, astfel încât locația și prețul să rămână aliniate între toate cardurile dintr-un rând.

### Fișier modificat
`src/components/products/ProductCard.tsx` — varianta `gallery` (cea folosită pe homepage și grid-uri).

### Schimbări
1. Containerul de info (`<div className="p-3 md:p-4">`) → adăugăm `flex flex-col` ca să putem controla verticalitatea.
2. `<h3>` titlu (`line-clamp-2`) → adăugăm `min-h-[2.5rem] md:min-h-[3.5rem]` (≈ 2 rânduri pentru `text-base`/`text-lg`) ca să rezerveze mereu înălțimea pentru 2 rânduri, indiferent dacă titlul are 1 sau 2 rânduri.
3. Opțional: blocul de preț primește `mt-auto` ca să fie împins la baza cardului — astfel toate prețurile se aliniază perfect chiar și dacă în viitor adăugăm conținut variabil.

### Ce NU se atinge
- Calculul prețurilor (deja rezolvat cu `formatPriceShort`).
- Varianta `list` a cardului (acolo nu există problema de aliniere pe grilă).
- Restul componentelor (cardurile sunt deja dimensionate prin grid-ul părinte).

Rezultat: toate prețurile dintr-un rând stau pe aceeași linie verticală, ca în Airbnb.