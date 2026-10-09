CREATE OR REPLACE FUNCTION public.moderate_review_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  disputed boolean := false;
  v_owner uuid;
BEGIN
  IF public.review_contains_contact(NEW.comment) THEN
    RAISE EXCEPTION 'CONTACT_BLOCKED: review contains contact information' USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'user_reviews' THEN
    IF NEW.reviewer_id = NEW.reviewed_user_id THEN
      RAISE EXCEPTION 'SELF_REVIEW: Nu îți poți lăsa review ție însuți' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF TG_TABLE_NAME = 'product_reviews' THEN
    SELECT owner_id INTO v_owner FROM public.products WHERE id = NEW.product_id;
    IF v_owner IS NOT NULL AND v_owner = NEW.reviewer_id THEN
      RAISE EXCEPTION 'SELF_REVIEW: Nu poți evalua propriul produs' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.rental_id IS NOT NULL THEN
    SELECT (r.dispute_status IS NOT NULL AND r.dispute_status <> 'none')
      INTO disputed FROM public.rentals r WHERE r.id = NEW.rental_id;
  END IF;

  NEW.status := 'pending_review';
  NEW.moderation_reason := CASE WHEN COALESCE(disputed,false) THEN 'dispute'
                                WHEN NEW.rating <= 3 THEN 'low_rating'
                                ELSE 'standard' END;
  NEW.moderated_at := NULL;
  NEW.moderated_by := NULL;
  RETURN NEW;
END;
$$;