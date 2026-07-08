CREATE OR REPLACE FUNCTION public.enforce_products_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_owner_soft_delete boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Allow the owner to soft-delete their own product: NULL -> timestamp,
  -- with deleted_by set to the acting user. Any other change to these
  -- two fields (revert, change value, spoof deleted_by) stays forbidden.
  is_owner_soft_delete :=
    OLD.deleted_at IS NULL
    AND NEW.deleted_at IS NOT NULL
    AND NEW.deleted_by = auth.uid()
    AND OLD.owner_id = auth.uid();

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.admin_flagged IS DISTINCT FROM OLD.admin_flagged
     OR NEW.flag_reason IS DISTINCT FROM OLD.flag_reason
     OR NEW.quality_score IS DISTINCT FROM OLD.quality_score
     OR NEW.admin_edited_at IS DISTINCT FROM OLD.admin_edited_at
     OR NEW.admin_edited_by IS DISTINCT FROM OLD.admin_edited_by
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR (NOT is_owner_soft_delete AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
     OR (NOT is_owner_soft_delete AND NEW.deleted_by IS DISTINCT FROM OLD.deleted_by) THEN
    RAISE EXCEPTION 'Not allowed to modify admin-controlled product fields';
  END IF;

  RETURN NEW;
END $function$;