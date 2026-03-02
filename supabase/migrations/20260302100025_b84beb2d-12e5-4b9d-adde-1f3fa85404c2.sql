
CREATE OR REPLACE FUNCTION public.get_rental_renter_info(renter_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM profiles p
  WHERE p.id = ANY(renter_ids)
    AND (
      -- Allow if current user has a rental where they are owner and the profile is the renter
      EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.owner_id = auth.uid()
          AND r.renter_id = p.id
      )
      -- Or if it's the user's own profile
      OR p.id = auth.uid()
      -- Or if user is admin
      OR has_role(auth.uid(), 'admin')
    );
$$;
