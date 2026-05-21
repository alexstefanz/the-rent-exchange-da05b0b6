## Scop

În chat-ul dintre proprietar și chiriaș există deja cardul portocaliu „Rezervare confirmată" (din screenshot), generat la plata checkout-ului. Îl extindem astfel încât **același tip de alertă** să apară automat, în realtime, pentru **fiecare tranziție din timeline-ul de 6 pași**, vizibil pentru ambii utilizatori, fără refresh.

## Pașii acoperiți (1 alertă/tranziție)

| # | Trigger | Titlul cardului (RO / EN) |
|---|---------|---------------------------|
| 1 | Cerere creată (există deja la checkout) | Rezervare confirmată / Booking confirmed |
| 2 | Proprietar acceptă cererea | Cerere acceptată / Request accepted |
| 2b| Proprietar refuză cererea | Cerere refuzată / Request declined |
| 3 | Plată autorizată / capturată | Plată efectuată / Payment completed |
| 4 | Predare confirmată (`handover_confirmed_at`) | Produs predat / Item handed over |
| 5 | Returnare inițiată (`return_initiated` / PV chiriaș semnat) | Returnare în curs / Return started |
| 6 | Returnare finalizată (`return_confirmed_at` / completed) | Închiriere finalizată / Rental completed |
| ✕ | Anulare (`cancelled_at`) | Rezervare anulată / Booking cancelled |

Fiecare card afișează: titlu produs, perioadă, total, plus o linie contextuală de status (ex. „Așteaptă plata chiriașului", „Așteaptă confirmarea predării", „Lasă o recenzie").

## Implementare

### 1. Trigger DB — sursă unică de adevăr

Migrare nouă cu funcția `notify_rental_chat_event()` + trigger `rental_chat_events_trg AFTER UPDATE ON public.rentals`.

- Detectează ce tranziție tocmai s-a întâmplat, comparând `OLD`/`NEW` pe: `status`, `payment_status`, `handover_confirmed_at`, `return_initiated`, `return_pv_renter_signed`, `return_confirmed_at`, `cancelled_at`.
- Găsește/creează conversația pentru `(owner_id, renter_id, product_id)`.
- Inserează un rând în `messages` cu `message_type='system'`, `sender_id=null`, `content` = payload pipe-separat, ex.:
  `request_accepted|<rental_public_id>|<product_title>|<start>|<end>|<days> zile|<subtotal> RON`
- Idempotent: skipează dacă există deja un system message care începe cu același `<kind>|<rental_public_id>` în acea conversație.
- Bumps `conversations.updated_at` ca inbox-ul să re-sorteze.

Kind-uri emise: `booking_confirmed` (existent), `request_accepted`, `request_declined`, `payment_completed`, `handover_done`, `return_started`, `rental_completed`, `booking_cancelled`.

### 2. Frontend — extindere `SystemMessageBubble.tsx`

Același card portocaliu/primary din screenshot, cu animația `motion` existentă.

- Generalizare `parseContent` la un switch peste cele 8 kind-uri → returnează `{ kind, icon, title, productTitle, dateRange, total, footerNote, tone }`.
- Mapare kind → icon + footer:
  - `request_accepted` → `CheckCircle2`, „Așteaptă plata chiriașului"
  - `request_declined` → `XCircle`, tone `neutral-dark`
  - `payment_completed` → `CreditCard`, „Așteaptă predarea produsului"
  - `handover_done` → `Package`, „Închirierea este activă"
  - `return_started` → `RotateCcw`, „Așteaptă confirmarea proprietarului"
  - `rental_completed` → `CheckCircle2`, „Lasă o recenzie"
  - `booking_cancelled` → `XCircle`, tone `neutral-dark`
- Bilingv via `useLanguage().t(...)`.
- Tone-uri: default = `border-primary/20 bg-primary/5 text-primary` (ca în screenshot); declined/cancelled = `border-foreground/20 bg-foreground/5 text-foreground`.

### 3. Realtime

Deja acoperit: `messages` e în publication-ul `supabase_realtime` și `ChatPanel` ascultă deja. Cardul apare instant la ambii participanți, fără refresh.

### 4. Edge functions

Niciuna nu necesită modificare — totul e centralizat la nivel DB, deci toate căile (acceptare/refuz `respond-rental-request`, captură Stripe, modificări manuale admin, mutual cancel, return flows, cancel renter) produc cardul consistent. Insert-ul existent `booking_confirmed` din `verify-stripe-payment` / `create-test-checkout-session` rămâne (idempotency guard-ul previne dublarea).

### 5. Fișiere modificate

- nou: `supabase/migrations/<ts>_rental_chat_timeline_events.sql` — funcția + trigger
- editat: `src/components/messaging/SystemMessageBubble.tsx` — parser + variante vizuale
- editat: `src/components/messaging/ConversationList.tsx` — extinde preview-ul „last message" (acum prinde doar `booking_confirmed|`) pentru toate cele 8 kind-uri (ex. „Cerere acceptată", „Plată efectuată")

### 6. Validare

- Build TypeScript curat.
- Manual: accept rezervare → trigger DB → row în `messages` → `ChatPanel` realtime → card portocaliu vizibil instant la ambii.
- Idempotency: re-update fără tranziție nouă nu duplică alerta.

Schimbare strict de prezentare/notificare — nu se atinge business logic, RLS sau status-flow.