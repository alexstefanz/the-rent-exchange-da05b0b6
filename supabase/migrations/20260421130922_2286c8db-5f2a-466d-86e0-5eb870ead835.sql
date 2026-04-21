-- Centralized helper to insert user notifications
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id uuid,
  p_type text,
  p_title_ro text,
  p_title_en text,
  p_description_ro text DEFAULT NULL,
  p_description_en text DEFAULT NULL,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title_ro, title_en, description_ro, description_en, link, is_read
  ) VALUES (
    p_user_id, p_type, p_title_ro, p_title_en, p_description_ro, p_description_en, p_link, false
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ===== KYC notifications =====
CREATE OR REPLACE FUNCTION public.notify_user_kyc_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- KYC submitted (INSERT with status SUBMITTED, or UPDATE to SUBMITTED)
  IF (TG_OP = 'INSERT' AND NEW.status = 'SUBMITTED')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'SUBMITTED' AND OLD.status IS DISTINCT FROM 'SUBMITTED') THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'kyc_submitted',
      'Verificare identitate trimisă',
      'Identity verification submitted',
      'Documentele tale sunt în curs de revizuire. Răspuns în max. 24h.',
      'Your documents are under review. Response within 24h.',
      '/verificare'
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'APPROVED' THEN
      PERFORM public.create_user_notification(
        NEW.user_id,
        'kyc_approved',
        'Identitate verificată ✓',
        'Identity verified ✓',
        'Contul tău este complet verificat. Poți începe să închiriezi.',
        'Your account is fully verified. You can start renting.',
        '/profile'
      );
    ELSIF NEW.status = 'REJECTED' THEN
      PERFORM public.create_user_notification(
        NEW.user_id,
        'kyc_rejected',
        'Verificare respinsă',
        'Verification rejected',
        COALESCE(NEW.rejection_reason, 'Documentele nu au putut fi validate.'),
        COALESCE(NEW.rejection_reason, 'Documents could not be validated.'),
        '/verificare'
      );
    ELSIF NEW.status = 'IN_PROGRESS' AND OLD.status IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW') THEN
      PERFORM public.create_user_notification(
        NEW.user_id,
        'kyc_reupload_requested',
        'Documente noi solicitate',
        'New documents requested',
        'Te rugăm să încarci din nou documentele pentru verificare.',
        'Please re-upload your documents for verification.',
        '/verificare'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_kyc_decision ON public.kyc_cases;
CREATE TRIGGER trg_notify_user_kyc_decision
AFTER INSERT OR UPDATE ON public.kyc_cases
FOR EACH ROW EXECUTE FUNCTION public.notify_user_kyc_decision();

-- ===== Product rejected =====
CREATE OR REPLACE FUNCTION public.notify_user_product_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.approval_status = 'rejected'
     AND OLD.approval_status IS DISTINCT FROM 'rejected' THEN
    PERFORM public.create_user_notification(
      NEW.owner_id,
      'product_rejected',
      'Produs respins: ' || NEW.title,
      'Product rejected: ' || NEW.title,
      COALESCE(NEW.flag_reason, 'Anunțul tău a fost respins de echipa de moderare.'),
      COALESCE(NEW.flag_reason, 'Your listing has been rejected by the moderation team.'),
      '/edit-product/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_product_rejected ON public.products;
CREATE TRIGGER trg_notify_user_product_rejected
AFTER UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_user_product_rejected();

-- ===== Ticket created =====
CREATE OR REPLACE FUNCTION public.notify_user_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.requester_user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.requester_user_id,
      'ticket_created',
      'Tichet creat: ' || NEW.public_id,
      'Ticket created: ' || NEW.public_id,
      'Solicitarea ta a fost înregistrată. Îți răspundem cât mai curând.',
      'Your request has been logged. We will reply as soon as possible.',
      '/suport'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_ticket_created ON public.ops_tickets;
CREATE TRIGGER trg_notify_user_ticket_created
AFTER INSERT ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_user_ticket_created();

-- ===== Ticket reply by admin =====
CREATE OR REPLACE FUNCTION public.notify_user_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester uuid;
  v_public_id text;
BEGIN
  IF NEW.author_type = 'ADMIN' AND COALESCE(NEW.is_internal, false) = false THEN
    SELECT requester_user_id, public_id INTO v_requester, v_public_id
    FROM public.ops_tickets WHERE id = NEW.ticket_id;

    IF v_requester IS NOT NULL THEN
      PERFORM public.create_user_notification(
        v_requester,
        'ticket_replied',
        'Răspuns la tichet ' || COALESCE(v_public_id, ''),
        'New reply on ticket ' || COALESCE(v_public_id, ''),
        LEFT(NEW.message_text, 140),
        LEFT(NEW.message_text, 140),
        '/suport'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_ticket_message ON public.ops_ticket_messages;
CREATE TRIGGER trg_notify_user_ticket_message
AFTER INSERT ON public.ops_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_user_ticket_message();

-- ===== Ticket closed/resolved =====
CREATE OR REPLACE FUNCTION public.notify_user_ticket_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IN ('CLOSED', 'RESOLVED')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.requester_user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.requester_user_id,
      'ticket_resolved',
      'Tichet închis: ' || NEW.public_id,
      'Ticket closed: ' || NEW.public_id,
      'Tichetul tău a fost marcat ca rezolvat. Poți deschide unul nou oricând.',
      'Your ticket has been resolved. You can open a new one anytime.',
      '/suport'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_ticket_resolved ON public.ops_tickets;
CREATE TRIGGER trg_notify_user_ticket_resolved
AFTER UPDATE ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_user_ticket_resolved();

-- ===== Withdrawal status =====
CREATE OR REPLACE FUNCTION public.notify_user_withdrawal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'withdrawal_requested',
      'Cerere de retragere înregistrată',
      'Withdrawal request submitted',
      'Suma ' || NEW.amount::text || ' RON urmează a fi procesată în 1-3 zile lucrătoare.',
      'Amount ' || NEW.amount::text || ' RON will be processed within 1-3 business days.',
      '/castiguri'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' OR NEW.status = 'paid' OR NEW.status = 'completed' THEN
      PERFORM public.create_user_notification(
        NEW.user_id,
        'withdrawal_processed',
        'Retragere procesată ✓',
        'Withdrawal processed ✓',
        'Suma ' || NEW.amount::text || ' RON a fost transferată în contul tău.',
        'Amount ' || NEW.amount::text || ' RON has been transferred to your account.',
        '/castiguri'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_user_notification(
        NEW.user_id,
        'withdrawal_rejected',
        'Retragere respinsă',
        'Withdrawal rejected',
        COALESCE(NEW.admin_note, 'Cererea ta de retragere a fost respinsă. Contactează suportul.'),
        COALESCE(NEW.admin_note, 'Your withdrawal request was rejected. Please contact support.'),
        '/castiguri'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_withdrawal_status ON public.withdrawal_requests;
CREATE TRIGGER trg_notify_user_withdrawal_status
AFTER INSERT OR UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_user_withdrawal_status();

-- ===== Owner payout received =====
CREATE OR REPLACE FUNCTION public.notify_user_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'owner_payout'
     AND NEW.status = 'completed'
     AND NEW.user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'payout_received',
      'Câștig adăugat în balanță',
      'Earnings added to balance',
      'Ai primit ' || NEW.amount::text || ' RON din închiriere.',
      'You received ' || NEW.amount::text || ' RON from a rental.',
      '/castiguri'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_payout ON public.transactions;
CREATE TRIGGER trg_notify_user_payout
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_user_payout();

-- ===== Account banned =====
CREATE OR REPLACE FUNCTION public.notify_user_banned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND COALESCE(NEW.is_banned, false) = true
     AND COALESCE(OLD.is_banned, false) = false THEN
    PERFORM public.create_user_notification(
      NEW.id,
      'account_banned',
      'Cont suspendat',
      'Account suspended',
      COALESCE(NEW.ban_reason, 'Contul tău a fost suspendat. Contactează suportul pentru detalii.'),
      COALESCE(NEW.ban_reason, 'Your account has been suspended. Contact support for details.'),
      '/suport'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_banned ON public.profiles;
CREATE TRIGGER trg_notify_user_banned
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_user_banned();