CREATE OR REPLACE FUNCTION public.validate_ops_ticket_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_title text := btrim(COALESCE(NEW.title, ''));
  v_description text := btrim(COALESCE(NEW.description, ''));
  v_norm text;
  v_bad text;
  v_bad_words text[] := ARRAY[
    'pula','pizda','pizdamatii','muie','muiest','futui','futute','futai','fut',
    'cacat','curva','curve','boule','prost','proasta','idiot','idioata',
    'cretin','cretina','dobitoc','dobitoaca','tampit','tampita','jegos','jegoasa',
    'pulamea','tarfa','tarfe','nesimtit','nesimtita','handicapat','retardat','retardata',
    'futumati','futinetamati','matiitifutu','panarama','labagiu','labagioaica',
    'cocalar','tigan','tiganca','jidan','teomor','teamenit','teameninti',
    'pwla','poola','puwla','pule','pulele','pulet','sugi','sugio','sugiopula',
    'sugimi','sugepula','sugepulamea','sugipula','mortiimati','mortiimatii',
    'mortiitai','mortiitaiii','cruceamati','cruceamatii','bisericamati',
    'bisericamatii','dumnezeulmatii','dumnezeumatii','dumnezeumati','pastelemati',
    'pastelematii','familiamatii','neamulmatii','mamatii','mamadracului',
    'ducetevadracului','ducetenpula','bagmiapula','bagmiapizda','bagpula',
    'tragipula','linsemiapula','lapula','pizdamasii','pizdamuii','futumama',
    'futumamata','futiomama','futiomortii','futinematii','futinemortii',
    'futiocrucea','fuck','fucker','fucking','motherfucker','shit','bullshit',
    'bitch','bitches','asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF char_length(v_title) < 8 THEN
    RAISE EXCEPTION 'TICKET_TITLE_TOO_SHORT:8' USING ERRCODE = 'check_violation';
  END IF;
  IF char_length(v_title) > 120 THEN
    RAISE EXCEPTION 'TICKET_TITLE_TOO_LONG:120' USING ERRCODE = 'check_violation';
  END IF;
  IF char_length(v_description) < 30 THEN
    RAISE EXCEPTION 'TICKET_DESCRIPTION_TOO_SHORT:30' USING ERRCODE = 'check_violation';
  END IF;
  IF char_length(v_description) > 5000 THEN
    RAISE EXCEPTION 'TICKET_DESCRIPTION_TOO_LONG:5000' USING ERRCODE = 'check_violation';
  END IF;

  v_norm := public.normalize_for_profanity(v_title || ' ' || v_description);
  FOREACH v_bad IN ARRAY v_bad_words LOOP
    IF position(v_bad IN v_norm) > 0 THEN
      RAISE EXCEPTION 'TICKET_PROFANITY_BLOCKED' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  NEW.title := v_title;
  NEW.description := v_description;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_ops_ticket_content ON public.ops_tickets;
CREATE TRIGGER trg_validate_ops_ticket_content
BEFORE INSERT OR UPDATE OF title, description ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.validate_ops_ticket_content();

CREATE OR REPLACE FUNCTION public.validate_ops_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_text text := btrim(COALESCE(NEW.message_text, ''));
  v_norm text;
  v_bad text;
  v_recent_count integer;
  v_duplicate_count integer;
  v_bad_words text[] := ARRAY[
    'pula','pizda','pizdamatii','muie','muiest','futui','futute','futai','fut',
    'cacat','curva','curve','boule','prost','proasta','idiot','idioata',
    'cretin','cretina','dobitoc','dobitoaca','tampit','tampita','jegos','jegoasa',
    'pulamea','tarfa','tarfe','nesimtit','nesimtita','handicapat','retardat','retardata',
    'futumati','futinetamati','matiitifutu','panarama','labagiu','labagioaica',
    'cocalar','tigan','tiganca','jidan','teomor','teamenit','teameninti',
    'pwla','poola','puwla','pule','pulele','pulet','sugi','sugio','sugiopula',
    'sugimi','sugepula','sugepulamea','sugipula','mortiimati','mortiimatii',
    'mortiitai','mortiitaiii','cruceamati','cruceamatii','bisericamati',
    'bisericamatii','dumnezeulmatii','dumnezeumatii','dumnezeumati','pastelemati',
    'pastelematii','familiamatii','neamulmatii','mamatii','mamadracului',
    'ducetevadracului','ducetenpula','bagmiapula','bagmiapizda','bagpula',
    'tragipula','linsemiapula','lapula','pizdamasii','pizdamuii','futumama',
    'futumamata','futiomama','futiomortii','futinematii','futinemortii',
    'futiocrucea','fuck','fucker','fucking','motherfucker','shit','bullshit',
    'bitch','bitches','asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF NEW.author_type IS DISTINCT FROM 'CUSTOMER' THEN
    RETURN NEW;
  END IF;

  IF v_text LIKE 'ticket-attachments://%' OR v_text LIKE 'support-attachments://%' THEN
    RETURN NEW;
  END IF;

  IF char_length(v_text) < 3 THEN
    RAISE EXCEPTION 'TICKET_REPLY_TOO_SHORT:3' USING ERRCODE = 'check_violation';
  END IF;
  IF char_length(v_text) > 500 THEN
    RAISE EXCEPTION 'TICKET_REPLY_TOO_LONG:500' USING ERRCODE = 'check_violation';
  END IF;

  v_norm := public.normalize_for_profanity(v_text);
  FOREACH v_bad IN ARRAY v_bad_words LOOP
    IF position(v_bad IN v_norm) > 0 THEN
      RAISE EXCEPTION 'TICKET_PROFANITY_BLOCKED' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO v_recent_count
    FROM public.ops_ticket_messages
    WHERE ticket_id = NEW.ticket_id
      AND author_id = NEW.author_id
      AND author_type = 'CUSTOMER'
      AND created_at > now() - interval '60 seconds';

    IF v_recent_count >= 3 THEN
      RAISE EXCEPTION 'TICKET_REPLY_RATE_LIMIT:60' USING ERRCODE = 'check_violation';
    END IF;

    SELECT count(*) INTO v_duplicate_count
    FROM public.ops_ticket_messages
    WHERE ticket_id = NEW.ticket_id
      AND author_id = NEW.author_id
      AND author_type = 'CUSTOMER'
      AND lower(btrim(message_text)) = lower(v_text)
      AND created_at > now() - interval '10 minutes';

    IF v_duplicate_count > 0 THEN
      RAISE EXCEPTION 'TICKET_REPLY_DUPLICATE:10' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.message_text := v_text;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_ops_ticket_message ON public.ops_ticket_messages;
CREATE TRIGGER trg_validate_ops_ticket_message
BEFORE INSERT OR UPDATE OF message_text ON public.ops_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_ops_ticket_message();

REVOKE ALL ON FUNCTION public.validate_ops_ticket_content() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_ops_ticket_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_ops_ticket_content() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_ops_ticket_message() TO service_role;