CREATE OR REPLACE FUNCTION public.check_review_profanity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  norm text;
  word text;
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
    'mata','matii',
    'fuck','fucker','fucking','motherfucker','shit','bullshit','bitch','bitches',
    'asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF NEW.comment IS NULL OR length(NEW.comment) = 0 THEN
    RETURN NEW;
  END IF;

  -- Word-aware matching: exact match per word to avoid false positives
  -- (e.g. "automata" containing "mata").
  FOREACH word IN ARRAY regexp_split_to_array(NEW.comment, '[^\p{L}\p{N}@$]+') LOOP
    word := public.normalize_for_profanity(word);
    IF word <> '' AND word = ANY (bad_words) THEN
      RAISE EXCEPTION 'PROFANITY_BLOCKED: comment contains inappropriate language'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  -- Collapsed-text matching only for long (>= 8 chars) compound insults,
  -- to still catch obfuscated spacing.
  norm := public.normalize_for_profanity(NEW.comment);
  FOREACH bad IN ARRAY bad_words LOOP
    IF length(bad) >= 8 AND position(bad IN norm) > 0 THEN
      RAISE EXCEPTION 'PROFANITY_BLOCKED: comment contains inappropriate language'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;