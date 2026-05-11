CREATE OR REPLACE FUNCTION public.notify_user_product_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.approval_status = 'approved'
     AND OLD.approval_status IS DISTINCT FROM 'approved' THEN
    PERFORM public.create_user_notification(
      NEW.owner_id,
      'product_published',
      'Anunțul tău a fost aprobat',
      'Your listing has been approved',
      'Anunțul „' || NEW.title || '" este acum vizibil pe platformă.',
      'The listing "' || NEW.title || '" is now visible on the platform.',
      '/produs/' || COALESCE(NEW.slug, NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_user_product_approved ON public.products;
CREATE TRIGGER trg_notify_user_product_approved
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_product_approved();