# Regulă anti-spam la deschiderea de tichete

Din captură se vede că un user a creat 5 tichete cu titlu „spam” în mai puțin de 1 minut. Adăugăm protecție server-side (în DB, deci nu poate fi ocolită) + mesaj clar în UI.

## Reguli propuse (toate aplicate pe `ops_tickets` la INSERT, înainte de salvare)

1. **Cooldown între tichete**: minim **60 secunde** între două tichete create de același user.
2. **Limită orară**: maxim **5 tichete / oră** per user.
3. **Limită zilnică**: maxim **15 tichete / 24h** per user.
4. **Maxim tichete deschise simultan**: **10 tichete** cu status `NEW`, `OPEN` sau `IN_PROGRESS` deschise de același user. Dacă atinge limita, trebuie să închidă/aștepte rezolvarea altora înainte să deschidă unul nou.
5. **Anti-duplicat**: blocăm un tichet nou dacă există deja unul de la același user cu **același titlu** (case-insensitive, trimmed) creat în ultimele **10 minute**.

Excepții:
- Adminii (`has_role(auth.uid(), 'admin')`) sunt exceptați de la toate regulile (pot crea tichete în numele altora).
- Tichetele create automat de Edge Functions (ex. `create-renter-cancellation-ticket`, anularea rezervării) folosesc `service_role` și ocolesc trigger-ul oricum — nu sunt afectate.

## Implementare

### 1. Migrare DB
- Funcție `public.enforce_ticket_antispam()` (PL/pgSQL, SECURITY DEFINER, `SET search_path = public`) care:
  - Returnează direct `NEW` dacă `NEW.requester_user_id IS NULL` sau dacă user-ul curent e admin.
  - Numără tichetele recente ale `requester_user_id` pe ferestre (1 min, 1 oră, 24h, deschise).
  - Verifică duplicate de titlu pe 10 min.
  - Aruncă `RAISE EXCEPTION` cu mesaje clare în română prefixate cu un cod (`ANTISPAM_COOLDOWN`, `ANTISPAM_HOURLY`, `ANTISPAM_DAILY`, `ANTISPAM_OPEN_LIMIT`, `ANTISPAM_DUPLICATE`) ca să le putem mapa în UI.
- Trigger `BEFORE INSERT ON public.ops_tickets FOR EACH ROW EXECUTE FUNCTION public.enforce_ticket_antispam()`.

### 2. UI — `createUserTicket` (`src/features/tickets/userTicketsApi.ts`)
- Catch pe eroarea Postgres, mapăm codul `ANTISPAM_*` la un mesaj prietenos (RO+EN via `uxCopy`) și-l aruncăm înapoi.
- Componentele care apelează `createUserTicket` (formular suport, SupportChatWidget, formulare contact/feedback) afișează deja toast pe eroare — vor afișa direct textul prietenos.

### 3. Curățare opțională (nu acum)
Tichetele deja create cu „spam” / „spam2”… rămân în DB. Le poate șterge adminul manual din ERP. Nu fac parte din această schimbare.

## Ce NU se atinge
- Nicio modificare la edge functions, la fluxul de cancellation, la rate-limit-ul de mesaje în chat (alt sistem).
- Fără schimbări de design / vizual în afara textului toast-ului de eroare.
