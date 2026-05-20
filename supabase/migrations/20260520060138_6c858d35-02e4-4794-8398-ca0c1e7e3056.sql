ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS included_items_en text[];

CREATE OR REPLACE FUNCTION public.trigger_translate_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT := 'https://tsffyecastudajmgrckt.supabase.co';
BEGIN
  IF (TG_OP = 'INSERT')
     OR (NEW.title IS DISTINCT FROM OLD.title)
     OR (NEW.description IS DISTINCT FROM OLD.description)
     OR (NEW.included_items IS DISTINCT FROM OLD.included_items)
  THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.title IS DISTINCT FROM OLD.title THEN
        NEW.title_en := NULL;
      END IF;
      IF NEW.description IS DISTINCT FROM OLD.description THEN
        NEW.description_en := NULL;
      END IF;
      IF NEW.included_items IS DISTINCT FROM OLD.included_items THEN
        NEW.included_items_en := NULL;
      END IF;
    END IF;

    PERFORM net.http_post(
      url := project_url || '/functions/v1/translate-product',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('productId', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_translate_trigger ON public.products;
CREATE TRIGGER products_translate_trigger
  BEFORE INSERT OR UPDATE OF title, description, included_items ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_translate_product();