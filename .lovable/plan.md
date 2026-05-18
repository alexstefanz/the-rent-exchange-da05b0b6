## Problemă

Lista de utilizatori afișează 0 deși există 30 de profiluri. Cauza: RPC-ul `get_admin_users` returnează eroarea PostgreSQL `42702: column reference "created_at" is ambiguous`.

În definiția funcției, `RETURNS TABLE(... created_at timestamptz ...)` introduce un nume de coloană de output care intră în conflict cu `created_at` din subinterogările pe `user_warnings`:

```sql
(SELECT MAX(created_at) FROM user_warnings WHERE user_id = p.id) AS last_warning_at
```

## Fix

Creez o migrare care recreează `public.get_admin_users(text, int, int, text)` cu coloanele calificate explicit (`user_warnings.created_at`, `user_warnings.user_id`) în toate subinterogările, ca să elimin ambiguitatea. Restul logicii (filtre status, totaluri, RLS via `has_role`) rămâne identică.

Suplimentar: șterg overload-ul vechi `get_admin_users(text, int, int)` cu 3 argumente (rămas din versiunea anterioară) ca să evităm confuzii viitoare la rezoluția funcției.

Nicio modificare în frontend.
