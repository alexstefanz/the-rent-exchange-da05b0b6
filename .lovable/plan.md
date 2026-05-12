# Notificare de platformă la plată (în loc de mesaj direct)

## Obiectiv
La finalizarea plății, NU se mai trimite un mesaj în numele chiriașului ("Bună! Tocmai am rezervat..."). În loc, se inserează în conversație o **notificare de sistem** (bubble central, stilizat ca eveniment de platformă) care anunță proprietarul că produsul X a fost rezervat pentru perioada Y → Z (N zile, total RON). Timeline-ul din header-ul chat-ului reflectă noul status (`Plătit`).

## Comportamentul nou în chat

```
─────────── Astăzi ───────────

  ┌──────────────────────────────────────────────┐
  │ 🛎  Rezervare confirmată                      │
  │ „Sony XM5" • 19 mai – 19 mai 2026 (1 zi)     │
  │ Total: 2 RON • Așteaptă confirmarea ta        │
  └──────────────────────────────────────────────┘
                                          16:36
```

- Centrat, fără avatar, fără bifă de "citit", fără sender — clar diferit de mesajele user-to-user.
- Dacă chiriașul a scris și un mesaj opțional la checkout, acela rămâne separat, ca mesaj normal de la chiriaș (după notificarea de sistem).

## Modificări

### 1. Bază de date (migrare nouă)
- `ALTER TABLE messages ADD COLUMN message_type text NOT NULL DEFAULT 'user'` cu `CHECK (message_type IN ('user','system'))`.
- `ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL` + `CHECK (message_type='system' OR sender_id IS NOT NULL)`.
- Policy SELECT existentă pe participanți acoperă deja `system` (filtrare pe `conversation_id`); nu schimbăm INSERT (system messages se inserează doar cu service role din edge function).
- Regenerare automată a `types.ts`.

### 2. Edge function `verify-stripe-payment`
- În blocul post-payment (liniile ~174-232), păstrăm crearea conversației, dar:
  - Dacă există `messageToOwner` (mesajul opțional al chiriașului), îl inserăm ca acum cu `sender_id=renter_id, message_type='user'`.
  - În plus (sau independent), inserăm **întotdeauna** un mesaj `message_type='system', sender_id=NULL` cu conținut JSON-like simplu sau text formatat: titlu produs, perioadă, zile, total. Folosim un payload structurat în `content` (text simplu) — fără cod nou de schemă.
  - Idempotență: verificăm prin `message_type='system'` + `conversation_id` (ca să nu duplicăm la retry webhook).
  - Apelul `send-message-notification` se face DOAR pentru mesajul user (dacă există); pentru cel de sistem, notificarea de rezervare există deja prin `send-rental-notification` (linia 239), deci nu dublăm.

### 3. Frontend chat
- `MessageBubble.tsx`: detectează `message.message_type === 'system'` și redă un layout central (`SystemMessageBubble`) — pill/card cu icon `BellRing`, titlu "Rezervare confirmată" (RO/EN), subtext cu detaliile, ora dedesubt. Fără avatar, fără bifă.
- Tipul `Message` în `src/features/messaging/messagingApi.ts`: adăugăm `message_type?: 'user' | 'system'`.
- Selectele din `messagingApi` (lista de mesaje) iau `message_type` în plus.
- `ConversationList.tsx`: pentru preview-ul ultimului mesaj, dacă `message_type='system'`, afișăm "🛎 Rezervare confirmată" în loc de conținut crud.

### 4. Timeline (header chat)
- `RentalStageStepper.tsx` deja reflectă pasul `paid` prin `payment_status='captured'/'authorized'` sau `paid_at`. Verificăm că rental-ul încărcat în `ChatPanel`/`InfoPanel` reîmprospătează datele după webhook-ul de plată (deja realtime). Nu sunt schimbări de logică, doar confirmare vizuală că, după plată, badge-ul `Plătit` devine `current` în loc de `Aprobat`.

### 5. Curățare
- Marcăm `ensureRentalContextMessage` din `src/features/messaging/messagingApi.ts` ca eliminat (era deja `@deprecated`).

## Detalii tehnice
- Conținut sugerat pentru mesajul de sistem (RO):
  `Rezervare confirmată • „<titlu>" • <start> – <end> (<n> <zi/zile>) • Total <subtotal> RON`
  Frontendul îl poate parsa ușor sau pur și simplu îl afișează aliniat central. Pentru robustețe vom împărți în două linii prin `\n`.
- Notificările push/email pentru proprietar continuă să meargă prin `send-rental-notification` (template `new-rental-request`), neschimbat.
- Nicio modificare la regulile de moderare/URL — mesajul system este generat doar de edge function cu service role.

## Out of scope
- Nu se modifică template-urile de email.
- Nu se modifică restul fluxurilor (handover, return) — doar pasul „plată → notificare în chat".
