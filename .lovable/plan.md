

# Adaugare Favorite Produse (Anunturi)

## Situatia actuala
Exista doar un sistem de favorite pentru **utilizatori** (`favorite_users` table). Nu exista nicio tabela sau functionalitate pentru a salva **produse/anunturi** la favorite. Butonul Heart de pe pagina de produs exista vizual dar nu salveaza nimic in baza de date.

## Ce vom implementa

### 1. Creare tabela `favorite_products` in baza de date
- Coloane: `id`, `user_id`, `product_id`, `created_at`
- Constrangere unica pe `(user_id, product_id)` pentru a preveni duplicatele
- Politici RLS: utilizatorii pot vedea/adauga/sterge doar propriile favorite

### 2. Creare API `src/features/profile/favoriteProductsApi.ts`
Functii:
- `addFavoriteProduct(productId)` - adauga la favorite
- `removeFavoriteProduct(productId)` - sterge din favorite
- `isProductFavorite(productId)` - verifica daca e favorit
- `getFavoriteProducts()` - returneaza lista de produse favorite (cu detalii)

### 3. Buton Heart pe galeria de imagini (dreapta jos)
Pe pagina `ProductDetail.tsx`:
- Adaugare buton Heart in coltul dreapta-jos al containerului de imagine (atat desktop cat si mobil)
- La click: verifica autentificare, apoi toggle favorit in baza de date
- Afisare stare reala (plin rosu = favorit, gol = nefavorit)
- Preluare stare initiala la incarcare pagina

### 4. Tab "Favorite" in Profil
- Adaugare tab nou in `Profile.tsx` cu iconita Heart
- Creare componenta `FavoritesTab.tsx` care afiseaza produsele favorite ca un grid de ProductCard-uri
- Buton de stergere rapida din favorite

## Detalii Tehnice

### Schema baza de date
```sql
CREATE TABLE favorite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE favorite_products ENABLE ROW LEVEL SECURITY;

-- Politici RLS
CREATE POLICY "Users can view own favorite products" ON favorite_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorite products" ON favorite_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorite products" ON favorite_products FOR DELETE USING (auth.uid() = user_id);
```

### Fisiere noi
| Fisier | Scop |
|--------|------|
| `src/features/profile/favoriteProductsApi.ts` | API pentru CRUD favorite produse |
| `src/components/profile/FavoritesTab.tsx` | Tab cu lista de produse favorite |

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/pages/ProductDetail.tsx` | Buton Heart pe galeria de imagini + logica reala de toggle |
| `src/pages/Profile.tsx` | Adaugare tab "Favorite" |
| `src/data/uxCopy.ts` | Adaugare texte pentru sectiunea favorite |
| `src/components/products/ProductCard.tsx` | Conectare buton Heart existent la API-ul real |

