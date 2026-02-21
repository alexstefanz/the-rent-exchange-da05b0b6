
-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Function to generate a URL-friendly slug from a title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert to lowercase, replace diacritics, replace non-alphanumeric with hyphens
  base_slug := lower(title);
  -- Replace Romanian diacritics
  base_slug := replace(base_slug, 'ă', 'a');
  base_slug := replace(base_slug, 'â', 'a');
  base_slug := replace(base_slug, 'î', 'i');
  base_slug := replace(base_slug, 'ș', 's');
  base_slug := replace(base_slug, 'ț', 't');
  base_slug := replace(base_slug, 'ş', 's');
  base_slug := replace(base_slug, 'ţ', 't');
  -- Replace spaces and special chars with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Limit length
  base_slug := left(base_slug, 80);

  final_slug := base_slug;

  -- Ensure uniqueness
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.products WHERE slug = final_slug
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Trigger function to auto-set slug on insert/update of title
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only regenerate slug if title changed or slug is null
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := public.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to products table
DROP TRIGGER IF EXISTS trg_set_product_slug ON public.products;
CREATE TRIGGER trg_set_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_product_slug();

-- Backfill slugs for existing products (run generate_slug per product to ensure uniqueness)
DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
BEGIN
  FOR rec IN SELECT id, title FROM public.products WHERE slug IS NULL ORDER BY created_at LOOP
    new_slug := public.generate_slug(rec.title);
    UPDATE public.products SET slug = new_slug WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Add unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
