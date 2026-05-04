CREATE OR REPLACE FUNCTION public.notify_admin_withdrawal_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_name text;
  v_phone text;
  v_desc_ro text;
  v_desc_en text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name, phone INTO v_user_name, v_phone
  FROM profiles WHERE id = NEW.user_id;

  v_desc_ro := COALESCE(v_user_name, 'Utilizator')
    || ' solicită ' || NEW.amount::text || ' RON'
    || E'\nIBAN: ' || NEW.iban
    || E'\nTelefon: ' || COALESCE(v_phone, 'nespecificat');

  v_desc_en := COALESCE(v_user_name, 'User')
    || ' requests ' || NEW.amount::text || ' RON'
    || E'\nIBAN: ' || NEW.iban
    || E'\nPhone: ' || COALESCE(v_phone, 'not provided');

  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'withdrawal_requested',
    'Cerere nouă de retragere',
    'New withdrawal request',
    v_desc_ro,
    v_desc_en,
    '/admin/withdrawals',
    NEW.id,
    'withdrawal',
    'normal'
  );

  RETURN NEW;
END;
$function$;