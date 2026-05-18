## Problem

Notificările apar doar după refresh, deși:
- Tabela `notifications` este în publicația `supabase_realtime`
- Există subscriere `postgres_changes` în `useNotifications` (și backup în `useGlobalRealtime`)
- RLS permite `auth.uid() = user_id`

Cauza reală: socket-ul Realtime nu primește JWT-ul utilizatorului autentificat după login / refresh de token. Fără JWT valid, Realtime evaluează RLS ca user anonim și **filtrează** evenimentele înainte să ajungă la client. Asta explică perfect "apar doar după refresh" — la refresh, socket-ul se reinițializează cu token-ul deja prezent în storage.

`AuthContext.onAuthStateChange` nu apelează `supabase.realtime.setAuth(...)`, iar clientul din `src/integrations/supabase/client.ts` nu propagă explicit token-ul către realtime.

## Modificări

### 1. `src/contexts/AuthContext.tsx`
- În callback-ul `onAuthStateChange` (rămâne sincron), adaugă imediat după `setSession(session)`:
  ```ts
  supabase.realtime.setAuth(session?.access_token ?? null);
  ```
- Apel similar după `getSession()` la mount, ca socket-ul să fie autentificat înainte ca primele canale să se aboneze.

Asta forțează ca toate canalele Realtime existente să refolosească JWT-ul curent — inclusiv la TOKEN_REFRESHED.

### 2. `src/hooks/queries/useNotifications.ts`
- Adaugă log la `subscribe((status) => ...)` pentru a putea verifica în consolă că statusul devine `SUBSCRIBED` (debug temporar, util pentru QA).
- Re-creează canalul când se schimbă `userId` (deja se face prin dependencies).
- Fără alte schimbări de logică (păstrăm optimistic prepend/update/delete).

### 3. `src/hooks/useGlobalRealtime.ts`
- Elimină handler-ul duplicat pentru tabela `notifications` (acum garantat prin `useNotifications`). Reduce zgomotul și invalidările redundante. Restul subscripțiilor (rentals, messages, ops_tickets, etc.) rămân.

### 4. QA
- Deschid preview, login, las pagina deschisă cu bell-ul vizibil.
- Dintr-o sesiune separată inserez o notificare de test pentru user-ul respectiv și verific că:
  - Badge-ul de pe clopoțel se incrementează fără refresh.
  - Notificarea apare în popover/sheet.
- Verific în consolă mesajul `SUBSCRIBED` pentru ambele canale (notifications + global).

Nicio modificare la RLS, edge functions, sau structura DB — fix doar în autentificarea socket-ului Realtime.