CREATE OR REPLACE FUNCTION public.notify_user_kyc_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        'Contul tău este complet verificat. Adaugă primul tău produs și începe să câștigi.',
        'Your account is fully verified. Add your first product and start earning.',
        '/owner/new-product'
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