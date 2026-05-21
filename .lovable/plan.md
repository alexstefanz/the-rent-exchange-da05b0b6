# Limită simboluri speciale în chat-uri

## Problemă
Limita `MAX_SPECIAL_CHARS = 20` (din `src/features/messaging/messagingApi.ts`) este definită, dar:
1. **Chat proprietar/chiriaș** (`MessageInput.tsx`): are contor vizual, dar nu blochează tastarea — doar la send aruncă toast (corect, dar UX-ul permite să scrii 500 caractere fără feedback puternic).
2. **Suport — Centrul de tichete** (`TicketChat.tsx`): la fel — validare doar la send.
3. **Suport — Widget plutitor** (`SupportChatWidget.tsx`): nu are contor vizual de simboluri deloc, doar verificarea la send. Plus, fluxul de admin (`createTicketMessage`) și fluxul de creare ticket nou (`createUserTicket` cu `description`) **nu validează** simbolurile speciale înainte de insert — un admin sau un user nou poate scăpa de limită prin crearea unui ticket cu 500 caractere `#%^`.
4. **Server-side**: niciun guard la nivel de DB / API — dacă cineva ocolește UI-ul, mesajul intră.

## Soluție

### 1. Centralizare helper
În `src/features/messaging/messagingApi.ts`:
- exportă `MAX_SPECIAL_CHARS` (deja exportat) + adaugă util `enforceSpecialCharLimit(text)` care întoarce `{ ok: boolean, count: number }`.

### 2. Blocare la tastare în toate input-urile
- `src/components/messaging/MessageInput.tsx`
- `src/components/support/center/TicketChat.tsx`
- `src/components/support/SupportChatWidget.tsx` (ambele textarea: creare ticket nou + reply în ticket)

Comportament: dacă noul text depășește 20 simboluri speciale, **nu permite update-ul state-ului** (refuză caracterul în plus) și afișează scurt un toast / indicator roșu „Maxim 20 simboluri speciale". Contorul `simboluri: X/20` apare permanent pe toate cele 3 input-uri (acum lipsește în SupportChatWidget).

### 3. Validare în toate căile de send
În `SupportChatWidget.tsx`:
- `ensureTicketAndSend` (creare ticket): validează `text` (title + description + first message) înainte de `createUserTicket`.
- `sendMutation.mutationFn` (atât `createTicketMessage` admin/notă internă, cât și `addUserTicketMessage`): validează înainte de insert. Acum validarea e doar în `handleSendTicketMessage`, dar `ensureTicketAndSend(url)` la upload imagine sărise oricum (URL-ul de imagine e exempt — ok).

### 4. Guard server-side (DB)
Adaugă funcție + trigger în Postgres:
- `public.count_special_chars(text)` — replică regex-ul `[^\p{L}\p{N}\s.,!?;:\-'"()…–]` (Postgres `regexp_matches` cu `g`).
- Trigger `BEFORE INSERT OR UPDATE` pe `public.messages` (chat proprietar/chiriaș) și pe `public.ops_ticket_messages` (suport) care:
  - respinge dacă `length(message) > 500`
  - respinge dacă `count_special_chars(message) > 20`
  - exceptă rândurile unde `message_text` e un URL de attachment (regex `^https?://`), ca să nu blocheze imaginile.

Astfel limita e respectată indiferent de UI.

## Fișiere modificate

```text
src/features/messaging/messagingApi.ts      # helper enforceSpecialCharLimit
src/components/messaging/MessageInput.tsx   # blocare la tastare
src/components/support/center/TicketChat.tsx # blocare la tastare
src/components/support/SupportChatWidget.tsx # contor + blocare + validare în toate send-urile
supabase/migrations/<new>.sql               # count_special_chars + triggere
```

## Nu se modifică
- Limitele actuale (500 / 20) rămân.
- Lista de caractere permise rămâne aceeași.
- Nu modificăm regulile anti-contact (URL/email/telefon) — sunt separate.
