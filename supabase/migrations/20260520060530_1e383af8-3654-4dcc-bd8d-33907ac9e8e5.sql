DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.products
    WHERE included_items IS NOT NULL
      AND array_length(included_items, 1) > 0
      AND (
        included_items_en IS NULL
        OR array_length(included_items_en, 1) IS DISTINCT FROM array_length(included_items, 1)
      )
  LOOP
    PERFORM net.http_post(
      url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/translate-product',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('productId', r.id::text, 'force', true)
    );
  END LOOP;
END $$;