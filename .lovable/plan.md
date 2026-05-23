# Fix: redenumirea categoriei nu mută produsele existente

## Cauza
Tabelul `products` stochează categoria ca **text liber** (`products.category`, `products.subcategory`), nu ca foreign key spre `platform_categories.id`. Când admin-ul redenumește o categorie în tabelul `platform_categories` (ex. „Outdoor" → „Drumeții & Natură"), produsele rămân cu vechiul text și „dispar" din categoria nouă.

## Soluție

### 1. Trigger DB pe `platform_categories` (AFTER UPDATE)
Când `name` sau `name_en` se schimbă, trigger-ul actualizează automat `products.category` pentru toate produsele care aveau valoarea veche. Identic pentru `platform_subcategories` → `products.subcategory`.

Avantaj: funcționează indiferent unde se face redenumirea (admin UI, dashboard widget, viitoare tool-uri, SQL direct).

### 2. Backfill one-time pentru orfanii existenți
Rulez în aceeași migrare: produsele cu `category = 'Outdoor'` → setate la noul nume al categoriei (`Drumeții & Natură`), astfel încât cortul tău reapare imediat. Verific întâi ce alte denumiri orfane mai există.

### 3. Fără schimbări de cod frontend
Nu e nevoie să modific `categoriesApi.ts` sau UI-ul admin — trigger-ul rezolvă transparent.

## Detalii tehnice

```sql
-- Funcție: la UPDATE pe platform_categories, propagă name change
CREATE FUNCTION sync_products_on_category_rename() ...
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE products SET category = NEW.name WHERE category = OLD.name;
  END IF;

-- Trigger AFTER UPDATE pe platform_categories
-- Trigger similar AFTER UPDATE pe platform_subcategories
-- Backfill: UPDATE products SET category='Drumeții & Natură' WHERE category='Outdoor';
```

## Notă
Migrarea pe termen lung către FK (`category_id uuid REFERENCES platform_categories`) ar fi mai curată, dar implică refactor masiv în filtre, query-uri și seed. Trigger-ul rezolvă problema raportată acum, fără regresii.
