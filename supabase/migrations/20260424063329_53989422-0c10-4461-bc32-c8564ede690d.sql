CREATE OR REPLACE FUNCTION public.notify_user_payout()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_title text;
  v_desc_ro text;
  v_desc_en text;
BEGIN
  IF NEW.type = 'owner_payout'
     AND NEW.status = 'completed'
     AND NEW.user_id IS NOT NULL THEN

    IF NEW.rental_id IS NOT NULL THEN
      SELECT p.title INTO v_product_title
      FROM rentals r
      JOIN products p ON p.id = r.product_id
      WHERE r.id = NEW.rental_id;
    END IF;

    IF v_product_title IS NOT NULL AND length(trim(v_product_title)) > 0 THEN
      v_desc_ro := 'Ai primit ' || NEW.amount::text || ' RON pentru închirierea „' || v_product_title || '".';
      v_desc_en := 'You received ' || NEW.amount::text || ' RON for the rental of "' || v_product_title || '".';
    ELSE
      v_desc_ro := 'Ai primit ' || NEW.amount::text || ' RON din închiriere.';
      v_desc_en := 'You received ' || NEW.amount::text || ' RON from a rental.';
    END IF;

    PERFORM public.create_user_notification(
      NEW.user_id,
      'payout_received',
      'Câștig adăugat în balanță',
      'Earnings added to balance',
      v_desc_ro,
      v_desc_en,
      '/castiguri'
    );
  END IF;
  RETURN NEW;
END;
$function$;