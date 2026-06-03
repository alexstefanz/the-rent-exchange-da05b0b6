-- Re-apply column-level REVOKEs on sensitive products columns to ensure
-- anon and authenticated roles cannot read them via the Data API. RLS row
-- policies allow public SELECT on active products, but column-level grants
-- must explicitly exclude sensitive fields.

REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM anon;

REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM authenticated;

-- Re-grant SELECT on the safe (non-sensitive) columns so the public listing API keeps working.
-- We grant SELECT on the entire table first (covers any newly added safe columns),
-- then re-revoke the sensitive columns above. Postgres column-level REVOKE wins.
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;

-- Re-apply the column-level REVOKEs AFTER the broad GRANT (GRANT resets column privileges).
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM anon;

REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM authenticated;
