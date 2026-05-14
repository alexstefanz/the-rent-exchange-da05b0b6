CREATE OR REPLACE FUNCTION public.normalize_for_profanity(input text) RETURNS text LANGUAGE sql IMMUTABLE AS $func$ SELECT regexp_replace(lower(translate(coalesce(input,''), 'ăâîșşțţĂÂÎȘŞȚŢ0134578@$', 'aaisstaaaisstt' || 'oieasta' || 'as')), '[^a-z0-9]+', '', 'g'); $func$;

CREATE OR REPLACE FUNCTION public.check_message_profanity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE
  norm text;
  bad text;
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
    'fuck','fucker','fucking','motherfucker','shit','bullshit','bitch','bitches',
    'asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF NEW.content IS NULL OR length(NEW.content) = 0 THEN RETURN NEW; END IF;
  IF NEW.message_type = 'system' THEN RETURN NEW; END IF;
  norm := public.normalize_for_profanity(NEW.content);
  FOREACH bad IN ARRAY bad_words LOOP
    IF position(bad IN norm) > 0 THEN
      RAISE EXCEPTION 'PROFANITY_BLOCKED: message contains forbidden language' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$func$;