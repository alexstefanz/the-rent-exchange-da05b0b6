
-- ============ KYC CASES ============
CREATE OR REPLACE FUNCTION public.enforce_kyc_cases_user_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.risk_score IS DISTINCT FROM OLD.risk_score
     OR NEW.decided_by_admin_id IS DISTINCT FROM OLD.decided_by_admin_id
     OR NEW.decided_at IS DISTINCT FROM OLD.decided_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.level_required IS DISTINCT FROM OLD.level_required
     OR NEW.provider_name IS DISTINCT FROM OLD.provider_name
     OR NEW.provider_case_id IS DISTINCT FROM OLD.provider_case_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.user_role IS DISTINCT FROM OLD.user_role
     OR NEW.public_id IS DISTINCT FROM OLD.public_id THEN
    RAISE EXCEPTION 'Not allowed to modify admin-controlled KYC fields';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_kyc_cases_user_update ON public.kyc_cases;
CREATE TRIGGER trg_enforce_kyc_cases_user_update
  BEFORE UPDATE ON public.kyc_cases
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kyc_cases_user_update();

-- ============ PRODUCTS ============
CREATE OR REPLACE FUNCTION public.enforce_products_owner_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.admin_flagged IS DISTINCT FROM OLD.admin_flagged
     OR NEW.flag_reason IS DISTINCT FROM OLD.flag_reason
     OR NEW.quality_score IS DISTINCT FROM OLD.quality_score
     OR NEW.admin_edited_at IS DISTINCT FROM OLD.admin_edited_at
     OR NEW.admin_edited_by IS DISTINCT FROM OLD.admin_edited_by
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by THEN
    RAISE EXCEPTION 'Not allowed to modify admin-controlled product fields';
  END IF;
  -- Owner edits require re-approval: force approval_status back to pending on material changes
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_products_owner_update ON public.products;
CREATE TRIGGER trg_enforce_products_owner_update
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_products_owner_update();

-- ============ RENTALS ============
CREATE OR REPLACE FUNCTION public.enforce_rentals_participant_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
     OR NEW.dispute_status IS DISTINCT FROM OLD.dispute_status
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.public_id IS DISTINCT FROM OLD.public_id
     OR NEW.daily_rate IS DISTINCT FROM OLD.daily_rate THEN
    RAISE EXCEPTION 'Not allowed to modify payment/financial rental fields';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_rentals_participant_update ON public.rentals;
CREATE TRIGGER trg_enforce_rentals_participant_update
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rentals_participant_update();

-- ============ CONVERSATIONS ============
CREATE OR REPLACE FUNCTION public.enforce_conversations_participant_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN
    RAISE EXCEPTION 'Not allowed to reassign conversation participants';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_conversations_participant_update ON public.conversations;
CREATE TRIGGER trg_enforce_conversations_participant_update
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_conversations_participant_update();
