-- Add English translation columns for product title and description
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Helper function: invoke translate-product edge function asynchronously via pg_net
CREATE OR REPLACE FUNCTION public.trigger_translate_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT := 'https://tsffyecastudajmgrckt.supabase.co';
  service_key TEXT;
BEGIN
  -- Only translate when title or description actually changed (or on insert)
  IF (TG_OP = 'INSERT')
     OR (NEW.title IS DISTINCT FROM OLD.title)
     OR (NEW.description IS DISTINCT FROM OLD.description)
  THEN
    -- Reset EN versions when source changed so the function repopulates them
    IF TG_OP = 'UPDATE' THEN
      IF NEW.title IS DISTINCT FROM OLD.title THEN
        NEW.title_en := NULL;
      END IF;
      IF NEW.description IS DISTINCT FROM OLD.description THEN
        NEW.description_en := NULL;
      END IF;
    END IF;

    -- Fire-and-forget HTTP call to edge function. We don't need the response.
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
  AFTER INSERT OR UPDATE OF title, description ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_translate_product();
