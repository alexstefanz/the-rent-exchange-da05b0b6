CREATE OR REPLACE FUNCTION public.enforce_products_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_owner_soft_delete boolean;
  is_owner_resubmit boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  is_owner_soft_delete :=
    OLD.deleted_at IS NULL
    AND NEW.deleted_at IS NOT NULL
    AND NEW.deleted_by = auth.uid()
    AND OLD.owner_id = auth.uid();

  -- Owner editing an already-moderated listing pushes it back to review.
  is_owner_resubmit :=
    OLD.owner_id = auth.uid()
    AND NEW.approval_status = 'pending'
    AND OLD.approval_status IN ('approved', 'rejected');

  IF (NOT is_owner_resubmit AND NEW.approval_status IS DISTINCT FROM OLD.approval_status)
     OR NEW.admin_flagged IS DISTINCT FROM OLD.admin_flagged
     OR (NOT is_owner_resubmit AND NEW.flag_reason IS DISTINCT FROM OLD.flag_reason)
     OR (is_owner_resubmit AND NEW.flag_reason IS DISTINCT FROM OLD.flag_reason AND NEW.flag_reason IS NOT NULL)
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