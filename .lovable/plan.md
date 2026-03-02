

## Plan: Mutare "Mai multe anunțuri" sub cardul de booking

Modificare simplă în `src/pages/ProductDetail.tsx`:

1. **Ștergere** linia 242 (`<OwnerOtherListings .../>`) din coloana stângă (între hartă și ProductIncludes)
2. **Adăugare** `<OwnerOtherListings .../>` în coloana dreaptă, după closing `</div>` al cardului sticky de booking (după linia 305), dar încă în interiorul `div`-ului `lg:col-span-1`

Componenta va apărea sub cardul de rezervare (calendar + anulare gratuită), fără sticky, vizibilă la scroll.

**Fișier afectat**: `src/pages/ProductDetail.tsx` (2 modificări punctuale)

