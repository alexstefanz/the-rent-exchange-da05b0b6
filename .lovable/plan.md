# Titlu slider „Anunțuri din {oraș}" - corect doar când e adevărat

## Problemă
`NearbyProductsSlider` afișează mereu titlul „Anunțuri din {locationCity}" pe baza orașului produsului curent. `getNearbyProducts` însă, dacă nu găsește destule anunțuri în acel oraș, completează cu rezultate din aceeași categorie și apoi cu orice produs activ — astfel cardurile apar din alte orașe (Bacău, Iași, etc.) sub titlul „Anunțuri din Buhuși".

## Fix (frontend only)
În `src/components/products/NearbyProductsSlider.tsx`:
- După `setProducts(data)`, calculez câte produse au efectiv `location_city === locationCity`.
- Titlul devine:
  - `copy.nearby.listingsFrom(locationCity)` doar dacă **toate** cele afișate (primele 5) sunt din `locationCity`.
  - altfel `copy.nearby.similarListings` („Anunțuri similare" / „Similar listings").

Nu modific `getNearbyProducts` — fallback-ul rămâne util pentru a popula sliderul.
