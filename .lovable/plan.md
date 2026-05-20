## Problem

Pe pagina produsului, în EN, titlul și descrierea se traduc automat (via `translate-product` edge function + trigger), dar lista din **"What's included"** (`included_items`) rămâne în limba originală (RO) — exemplu: "telecomanda, Stand, cablu priza, cablu hdmi".

## Soluție — extindere mecanism existent de auto-traducere

### 1. DB migration
- `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS included_items_en text[];`
- Recreate `public.trigger_translate_product()`:
  - Adaugă `included_items` în lista de câmpuri urmărite (INSERT/UPDATE).
  - La schimbare `included_items`, setează `NEW.included_items_en := NULL`.
- Recreate trigger pentru `AFTER INSERT OR UPDATE OF title, description, included_items`.

### 2. Edge function `supabase/functions/translate-product/index.ts`
- Selectează și `included_items, included_items_en` din `products`.
- `needIncluded = product.included_items?.length > 0 && (force || !product.included_items_en)`.
- Adaugă helper `translateArray(items)` care trimite items ca JSON și cere AI să returneze JSON array de aceeași lungime. Prompt strict: `Translate each accessory/included item to short English (1–3 words). Return ONLY a JSON array of strings, same length, same order.`
- Parse robust (try/catch + fallback la `items` original dacă AI dă răspuns invalid).
- `updates.included_items_en = translated;`

### 3. Frontend
- `src/lib/productI18n.ts`: add `getDisplayIncludedItems(product, language)` helper.
- `src/pages/ProductDetail.tsx`: pass `displayIncludedItems` to `ProductInfoAccordion` instead of `(product as any).included_items`.
- `src/integrations/supabase/types.ts` se regenerează automat după migration.

### 4. Backfill (opțional)
- După deploy, un singur apel manual cu `force=true` pentru produsele existente cu `included_items_en IS NULL` — pot include un query SQL care apelează `net.http_post` în loop, sau doar las userii să facă orice update.

## Files

- nouă migration: `ALTER TABLE` + `CREATE OR REPLACE FUNCTION` + `DROP/CREATE TRIGGER`
- `supabase/functions/translate-product/index.ts` (~30 linii adăugate)
- `src/lib/productI18n.ts` (+5 linii)
- `src/pages/ProductDetail.tsx` (2 linii)

## Out of scope

- Traducerea altor câmpuri (usage_rules, etc.) — pot fi adăugate ulterior cu același pattern.