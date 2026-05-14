## Cauză

- SMS-urile conțin link de forma `https://rentli.ro/a/{token}` (generat în `notify-rental-event` din `secure_action_tokens`).
- Ruta frontend `/a/:token` (`ShortLinkRedirect.tsx`) face redirect către `https://<project>.supabase.co/functions/v1/resolve-action-token?t=...`.
- Edge function-ul `resolve-action-token` **nu este implementat** (lipsește din `supabase/functions/`), deși este declarat în `supabase/config.toml` cu `verify_jwt = false`.
- Rezultat: Supabase răspunde `{"code":"NOT_FOUND","message":"Requested function was not found"}`.

## Soluție

Creez edge function-ul lipsă: `supabase/functions/resolve-action-token/index.ts`.

**Comportament:**
1. Citește `?t={token}` din query string. Dacă lipsește → 400.
2. Folosește `SUPABASE_SERVICE_ROLE_KEY` pentru a face SELECT pe `secure_action_tokens` după `token`.
3. Dacă tokenul:
   - nu există → redirect 302 la `https://rentli.ro/?invalid_link=1`
   - este expirat (`expires_at < now()`) → redirect la `https://rentli.ro/?expired_link=1`
   - a fost deja folosit (`used_at IS NOT NULL`) → tot redirect la `redirect_path` (linkul rămâne idempotent timp de 7 zile, e mai prietenos decât eroare)
4. Setează `used_at = now()` la prima utilizare.
5. Returnează `Response.redirect("https://rentli.ro" + row.redirect_path, 302)` (cu fallback `/` dacă lipsește).
6. Suportă `OPTIONS` cu CORS.
7. Logging minim cu `console.log` pentru debugging.

**Securitate:**
- Folosește SERVICE_ROLE doar pentru lookup/update pe tabelul `secure_action_tokens` (nu expune date utilizator).
- Nu necesită JWT (deja `verify_jwt = false` în config.toml — corect, pentru că SMS-urile sunt publice).
- Tokenul însuși este secretul (random, ~7 zile valabilitate).

## Fișiere

- **Nou:** `supabase/functions/resolve-action-token/index.ts`
- Nimic de modificat în `config.toml`, `ShortLinkRedirect.tsx`, sau în SMS sender — totul e deja configurat să apeleze acest endpoint.

## Verificare după deploy

- Apăs un link existent din DB (`secure_action_tokens`) → trebuie să mă ducă la pagina corectă (ex: `/inchirieri/{id}`).
- A doua apăsare → continuă să meargă (idempotent).
- Token inexistent → redirect la home cu flag.