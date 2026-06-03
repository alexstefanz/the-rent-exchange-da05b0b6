-- Revoke SELECT on sensitive product columns from public roles; access via RPCs only
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM anon, authenticated, PUBLIC;

-- Admin INSERT/DELETE policies for rental_pv_documents
CREATE POLICY "Admins can insert PV docs"
  ON public.rental_pv_documents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete PV docs"
  ON public.rental_pv_documents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));