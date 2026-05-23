
CREATE OR REPLACE FUNCTION public.sync_products_on_category_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.products SET category = NEW.name WHERE category = OLD.name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_products_on_category_rename ON public.platform_categories;
CREATE TRIGGER trg_sync_products_on_category_rename
AFTER UPDATE ON public.platform_categories
FOR EACH ROW EXECUTE FUNCTION public.sync_products_on_category_rename();

CREATE OR REPLACE FUNCTION public.sync_products_on_subcategory_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.products SET subcategory = NEW.name WHERE subcategory = OLD.name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_products_on_subcategory_rename ON public.platform_subcategories;
CREATE TRIGGER trg_sync_products_on_subcategory_rename
AFTER UPDATE ON public.platform_subcategories
FOR EACH ROW EXECUTE FUNCTION public.sync_products_on_subcategory_rename();
