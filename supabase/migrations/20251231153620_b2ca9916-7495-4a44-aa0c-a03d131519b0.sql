-- Create secure function to get contact info only if user has a conversation with the owner
CREATE OR REPLACE FUNCTION public.get_contact_info_if_in_conversation(owner_uuid uuid)
RETURNS TABLE (
  full_name text,
  phone text,
  email text,
  whatsapp text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.full_name,
    p.phone,
    p.email,
    p.whatsapp,
    p.avatar_url
  FROM profiles p
  WHERE p.id = owner_uuid
  AND (
    auth.uid() = owner_uuid  -- Own profile
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.owner_id = owner_uuid AND c.buyer_id = auth.uid())
         OR (c.buyer_id = owner_uuid AND c.owner_id = auth.uid())
    )
  );
$$;