## Problem

Messages don't send. Root cause confirmed against the live DB:

```
SELECT public.count_special_chars('salut');
ERROR: invalid regular expression: invalid escape \ sequence
```

The trigger `trg_messages_enforce_limits` (added in the last migration to enforce the 500-char / 20-special-symbol limit) calls `count_special_chars`, whose regex uses `\p{L}` and `\p{N}`. PostgreSQL's regex engine does not support Unicode property escapes, so the function errors out, the `BEFORE INSERT` trigger aborts, and **every** insert into `public.messages` fails. Same trigger is attached to `public.ops_ticket_messages`, so support / ticket chats are also broken.

## Fix

New migration that replaces `public.count_special_chars` with a PostgreSQL-compatible regex using POSIX character classes, which handle Unicode letters (ă, â, î, ș, ț, …) correctly under the UTF-8 locale:

```sql
CREATE OR REPLACE FUNCTION public.count_special_chars(_t text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*)
     FROM regexp_matches(
       _t,
       '[^[:alnum:][:space:].,!?;:\-''"()…–]',
       'g'
     )),
    0
  )::int;
$$;
```

No changes needed in `enforce_chat_text_limits` itself, the trigger definitions, or any frontend code — the client-side regex in `messagingApi.ts` already uses the JS-supported `\p{L}\p{N}` with the `u` flag and works correctly.

## Validation

After applying the migration, run:

```sql
SELECT public.count_special_chars('salut'),            -- expect 0
       public.count_special_chars('hello world!!!'),   -- expect 0
       public.count_special_chars('ăâîșț test'),       -- expect 0
       public.count_special_chars('@@@###$$$');        -- expect 9
```

Then send a normal message from the chat UI — it should arrive without "Error sending message" in the console. Repeat from a support ticket to confirm `ops_ticket_messages` also works.
