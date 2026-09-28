CREATE OR REPLACE FUNCTION public.get_or_create_rental_conversation(p_rental_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role'
    OR current_setting('request.jwt.claim.role', true) = 'service_role';
  v_rental record;
  v_conv_id uuid;
BEGIN
  IF v_caller IS NULL AND NOT v_is_service_role THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id, product_id, renter_id, owner_id
    INTO v_rental
    FROM public.rentals
   WHERE id = p_rental_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rental not found';
  END IF;

  IF NOT v_is_service_role
     AND v_caller <> v_rental.renter_id
     AND v_caller <> v_rental.owner_id THEN
    RAISE EXCEPTION 'not a participant of this rental';
  END IF;

  -- Already linked to this rental: return it.
  SELECT id INTO v_conv_id
    FROM public.conversations
   WHERE rentals_id = p_rental_id;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Reuse the existing organic (questions) conversation for the same
  -- product + renter + owner, if one exists, by linking it to the rental.
  SELECT id INTO v_conv_id
    FROM public.conversations
   WHERE product_id = v_rental.product_id
     AND buyer_id = v_rental.renter_id
     AND owner_id = v_rental.owner_id
     AND rentals_id IS NULL
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    UPDATE public.conversations
       SET rentals_id = p_rental_id
     WHERE id = v_conv_id;
    RETURN v_conv_id;
  END IF;

  -- No prior conversation: create a new one linked to the rental.
  INSERT INTO public.conversations (product_id, buyer_id, owner_id, rentals_id)
  VALUES (v_rental.product_id, v_rental.renter_id, v_rental.owner_id, p_rental_id)
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$function$;