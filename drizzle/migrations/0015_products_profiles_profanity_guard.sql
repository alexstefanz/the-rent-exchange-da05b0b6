CREATE OR REPLACE FUNCTION public.text_has_profanity(input text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $f$
DECLARE
  w text; bad text; norm text;
  bad_words text[] := ARRAY[
    'pula','pizda','pizdamatii','muie','muiest','futui','futute','futai','fut',
    'cacat','curva','curve','boule','prost','proasta','idiot','idioata',
    'cretin','cretina','dobitoc','dobitoaca','tampit','tampita','jegos','jegoasa',
    'pulamea','tarfa','tarfe','nesimtit','nesimtita',
    'handicapat','retardat','retardata','futumati','futinetamati','matiitifutu',
    'panarama','labagiu','labagioaica','cocalar','tigan','tiganca','jidan',
    'teomor','teamenit','teameninti',
    'pwla','poola','puwla','pule','pulele','pulet',
    'sugi','sugio','sugiopula','sugimi','sugepula','sugepulamea','sugipula',
    'mortiimati','mortiimatii','mortiitai','mortiitaiii',
    'cruceamati','cruceamatii','bisericamati','bisericamatii',
    'dumnezeulmatii','dumnezeumatii','dumnezeumati',
    'pastelemati','pastelematii','familiamatii','neamulmatii','mamatii',
    'mamadracului','ducetevadracului','ducetenpula',
    'bagmiapula','bagmiapizda','bagpula','tragipula','linsemiapula','lapula',
    'pizdamasii','pizdamuii','futumama','futumamata','futiomama','futiomortii',
    'futinematii','futinemortii','futiocrucea',
    'mata','matii',
    'fuck','fucker','fucking','motherfucker','shit','bullshit','bitch','bitches',
    'asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF input IS NULL OR length(input) = 0 THEN RETURN false; END IF;
  FOREACH w IN ARRAY regexp_split_to_array(input, '[^[:alnum:]@$]+') LOOP
    w := public.normalize_for_profanity(w);
    IF w <> '' AND w = ANY (bad_words) THEN RETURN true; END IF;
  END LOOP;
  norm := public.normalize_for_profanity(input);
  FOREACH bad IN ARRAY bad_words LOOP
    IF length(bad) >= 8 AND position(bad IN norm) > 0 THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END;
$f$;

CREATE OR REPLACE FUNCTION public.check_product_profanity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE combined text;
BEGIN
  combined := concat_ws(' ', NEW.title, NEW.description, NEW.pickup_address,
    array_to_string(coalesce(NEW.included_items, '{}'), ' '),
    array_to_string(coalesce(NEW.usage_rules, '{}'), ' '),
    CASE WHEN NEW.pending_edits IS NOT NULL THEN concat_ws(' ',
      NEW.pending_edits->>'title', NEW.pending_edits->>'description', NEW.pending_edits->>'pickup_address',
      (SELECT string_agg(x, ' ') FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.pending_edits->'included_items')='array' THEN NEW.pending_edits->'included_items' ELSE '[]'::jsonb END) x),
      (SELECT string_agg(x, ' ') FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.pending_edits->'usage_rules')='array' THEN NEW.pending_edits->'usage_rules' ELSE '[]'::jsonb END) x)
    ) END);
  IF TG_OP = 'UPDATE' AND combined IS NOT DISTINCT FROM concat_ws(' ', OLD.title, OLD.description, OLD.pickup_address,
      array_to_string(coalesce(OLD.included_items, '{}'), ' '), array_to_string(coalesce(OLD.usage_rules, '{}'), ' '))
     AND NEW.pending_edits IS NOT DISTINCT FROM OLD.pending_edits THEN
    RETURN NEW;
  END IF;
  IF public.text_has_profanity(combined) THEN
    RAISE EXCEPTION 'PROFANITY_BLOCKED: listing contains inappropriate language' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS trg_check_product_profanity ON public.products;
CREATE TRIGGER trg_check_product_profanity BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_product_profanity();

CREATE OR REPLACE FUNCTION public.check_profile_profanity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.company_name IS DISTINCT FROM OLD.company_name)
     AND public.text_has_profanity(concat_ws(' ', NEW.full_name, NEW.company_name)) THEN
    RAISE EXCEPTION 'PROFANITY_BLOCKED: profile contains inappropriate language' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS trg_check_profile_profanity ON public.profiles;
CREATE TRIGGER trg_check_profile_profanity BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_profile_profanity();