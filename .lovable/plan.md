

## Plan: Secțiune "Mai multe anunțuri de la acest utilizator"

Adăugăm o secțiune nouă pe pagina de produs, între harta Google Maps și secțiunea "Ce este inclus", care afișează alte produse active ale aceluiași proprietar.

### Implementare

**1. Creare component `OwnerOtherListings.tsx`** (`src/components/product/OwnerOtherListings.tsx`)
- Primește `ownerId`, `currentProductId`, `ownerName` ca props
- Folosește `usePublicUserProducts` din `useProducts.ts` pentru a fetch-ui produsele owner-ului
- Filtrează produsul curent din rezultate
- Afișează un slider orizontal cu `ProductCard` (max 4-6 produse)
- Include un link "Vezi toate anunțurile" care duce la `/utilizator/{ownerId}`
- Design: card cu border, similar celorlalte secțiuni, cu titlu "Mai multe anunțuri de la {ownerName}"
- Dacă nu există alte produse, secțiunea nu se afișează

**2. Modificare `ProductDetail.tsx`**
- Import `OwnerOtherListings`
- Inserare între secțiunea de hartă (linia 239) și `ProductIncludes` (linia 241):
  ```
  <OwnerOtherListings ownerId={product.owner_id} currentProductId={product.id} ownerName={ownerName} />
  ```

### Fișiere afectate
- **Creat**: `src/components/product/OwnerOtherListings.tsx`
- **Modificat**: `src/pages/ProductDetail.tsx`

