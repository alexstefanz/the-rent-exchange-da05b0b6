CREATE OR REPLACE FUNCTION public.get_contact_info_if_in_conversation(owner_uuid uuid)
 RETURNS TABLE(full_name text, phone text, email text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.full_name, p.phone, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = owner_uuid
  AND (
    auth.uid() = owner_uuid
    OR EXISTS (
      SELECT 1 FROM rentals r
      WHERE ((r.owner_id = owner_uuid AND r.renter_id = auth.uid())
          OR (r.renter_id = owner_uuid AND r.owner_id = auth.uid()))
        AND r.payment_status IN ('authorized','paid','captured','partially_refunded','refunded')
    )
  );
$function$;