
# Support & Tickets Redesign — Faza 1 (User-side)

Faza 1 livrează experiența completă a utilizatorului: Smart Ticket Flow ghidat de AI, Support Center premium, floating widget realtime și chat cu media. Faza 2 (admin Support Operations + automations) e descrisă la finalul planului și va fi livrată într-o iterație separată după validarea Fazei 1.

## 1. Smart Ticket Flow ghidat (AI Assistant 4 pași)

Refactor `supabase/functions/support-ai-chat/index.ts` (extindem, nu rescriem):

- Înlocuim prompt-ul liber cu o **state machine în 4 pași** transmisă în system prompt: `step: "category" | "details" | "attachments" | "confirm"`. Frontend trimite step-ul curent + context acumulat.
- Step 1 — Categorie: AI propune chips cu cele 5 grupuri (Rezervare / Plată / Produs / Cont / KYC) prin tool `propose_category_chips`. Userul tap-uiește, NU scrie.
- Step 2 — Detalii: AI pune max 3 întrebări scurte adaptate categoriei, fiecare cu chips de răspuns rapid + opțiune "altceva" pentru text liber.
- Step 3 — Atașamente: AI sugerează contextual ("trimite o poză cu produsul"). Skip dacă nu e relevant.
- Step 4 — Confirmare: AI generează cu tool `draft_ticket` un brief complet (titlu, categorie, prioritate, rezumat) afișat într-un card "Confirmă ticketul" cu butoane Edit / Confirmă. Tool-ul existent `create_support_ticket` se apelează DOAR după confirm explicit.
- Reuse priority logic și auto-context (route, productId, reservationId) deja existente.

Beneficii: zero typing pe mobil, brief curat pentru admin, nu mai trebuie repetat contextul.

## 2. Support Center user (`src/pages/UserTickets.tsx`)

Înlocuim accordion-ul actual cu inbox modern card-based.

```text
┌──────────────────────────────────────────────────────┐
│ HERO: "Cum te putem ajuta?"                          │
│  [Caută ticketele tale…]   [+ Ticket nou]            │
├──────────────────────────────────────────────────────┤
│ QUICK ACTIONS: 4 tile-uri (Rezervare / Plată /       │
│  Produs / Altceva) → deschid widget cu step preset   │
├──────────────────────────────────────────────────────┤
│ FILTRE: Toate · Active · În așteptare · Rezolvate    │
├─────────────────────────────┬────────────────────────┤
│ LISTA TICKETE (card-based)  │ DETALIU (desktop)      │
│  TCK-001234 · Nou · 2h      │  Timeline status       │
│  Plată nereușită…           │  Conversație realtime  │
│  → Rezervare RNT-…          │  Atașamente grid       │
│  TCK-001233 · În lucru…     │  Context rezervare     │
└─────────────────────────────┴────────────────────────┘
```

Mobile: o coloană, click pe card → full-screen detail view (similar cu Mesaje).

Componente noi în `src/components/support/center/`:

- `SupportHero.tsx` — search + CTA + 4 quick action tiles.
- `TicketsInbox.tsx` — filtre (Active / Așteptare răspuns / Rezolvate), search live, lista scrollabilă.
- `TicketCard.tsx` — public_id, titlu, status pill colorat, last activity relativă, ultimul mesaj truncat, badge unread, indicator atașament. Hover scale subtil.
- `TicketDetail.tsx` — split-view container desktop / full-screen mobile.
- `TicketTimeline.tsx` — vizual stepper status (Nou → În analiză → În lucru → Rezolvat) cu timestamps și SLA pill ("răspuns în 2h"). Reuse pattern din `RentalTimeline.tsx`.
- `TicketContextPanel.tsx` — card lateral cu link către rezervarea/produsul asociat (deja avem `reservation_id` / `product_id`).
- `TicketChat.tsx` — bubbles user/admin/system, reuse stiluri din `MessageBubble.tsx`, suport markdown via `react-markdown` deja prezent, atașamente inline.

Statusuri vizuale (mapate pe cele existente în DB):

| DB | Label RO | Culoare |
|---|---|---|
| NEW | Nou | primary |
| IN_PROGRESS | În lucru | blue |
| WAITING_CUSTOMER | Așteptăm răspunsul tău | orange |
| WAITING_OWNER / WAITING_INTERNAL | În procesare | muted |
| RESOLVED | Rezolvat | green |
| CLOSED | Închis | muted |

Fără valori "Escaladat" în DB acum — dacă apar din Faza 2 admin (tag), le mapăm după.

## 3. Floating Support Widget premium (`SupportChatWidget.tsx`)

Refactor incremental, păstrăm logica existentă (FAQ, AI stream, ticket persist în localStorage):

- FAB redesign: gradient subtle `--primary` → `--primary-hover`, badge realtime cu count nereaduri, pulse subtle on new admin reply, AI avatar mic (bot icon) când e activ flow-ul AI.
- Drawer redesign: header cu status pill ticket activ ("Conectat cu suportul · Online"), subtle entrance animation, mobile 100dvh deja prezent, desktop card flotant cu shadow elegant.
- Quick actions sub FAQ: chips pentru "Rezervare nouă / Plată / Altceva" care presetază step 1 al AI flow-ului.
- Input bar: attach buton (camera mobile / fișier desktop), placeholder "Scrie sau selectează…", send disabled when empty.
- Smooth animations via framer-motion (deja folosit în proiect).

## 4. Realtime support chat cu media

Migrație DB (single migration):

- `ALTER TABLE ops_ticket_messages ADD COLUMN read_at timestamptz` + index `(ticket_id, author_type, read_at)`.
- `ALTER PUBLICATION supabase_realtime ADD TABLE ops_ticket_messages, ops_tickets;` — enable realtime.
- `REPLICA IDENTITY FULL` pe ambele.
- Storage bucket `ticket-attachments` (verificăm dacă există deja — `uploadTicketAttachment` îl folosește pentru admini); dacă da, adăugăm RLS-uri pentru clienți: insert dacă `requester_user_id = auth.uid()` pe ticket-ul țintă; select pe path-uri din ticketele proprii. Path convention: `<ticket_id>/<uuid>.<ext>`.
- RPC `mark_ticket_messages_read(p_ticket_id uuid)` — marchează ca citite mesajele non-CUSTOMER din ticket-ul propriu.

Hook nou `src/hooks/useTicketRealtime.ts`:

- Subscribe la `postgres_changes` pe `ops_ticket_messages` filtrat pe `ticket_id`, invalidează queries.
- Presence channel `ticket:{id}` pentru typing indicator (event `typing`, throttle 2s) și online status admin.
- Auto-call `mark_ticket_messages_read` când drawer/detail e vizibil.

API extinderi în `src/features/tickets/userTicketsApi.ts`:

- `addUserTicketAttachment(ticketId, file)` — compresie Canvas (reuse pattern din `SupportChatWidget`), upload, creează message + attachment row.
- `markTicketMessagesRead(ticketId)`.

`TicketChat.tsx` features: typing indicator (reuse `TypingIndicator.tsx` deja existent), seen tick când admin a citit, timestamps relative + DateSeparator (reuse component messaging), attach poze/video cu lightbox (reuse `MediaLightbox.tsx`).

## 5. Notificări

Reuse `notifications` table existent. La fiecare update pe ticket (admin reply, status change), backend emite deja email — adăugăm:

- Trigger Postgres pe `ops_ticket_messages` (insert non-internal, author_type != CUSTOMER) → insert în `notifications` cu link `/tickete?open={ticket_id}`.
- Realtime pe `notifications` deja activ → bell-ul existent va arăta badge instant.

Push notifications: out of scope acum, dar structura de notificări e pregătită.

## 6. Tehnic

Fișiere noi:

- `src/components/support/center/SupportHero.tsx`
- `src/components/support/center/TicketsInbox.tsx`
- `src/components/support/center/TicketCard.tsx`
- `src/components/support/center/TicketDetail.tsx`
- `src/components/support/center/TicketTimeline.tsx`
- `src/components/support/center/TicketContextPanel.tsx`
- `src/components/support/center/TicketChat.tsx`
- `src/components/support/center/StatusPill.tsx`
- `src/components/support/center/AttachmentBubble.tsx`
- `src/hooks/useTicketRealtime.ts`
- `src/features/tickets/userTicketsApi.ts` (extins)
- 1 migrație DB (read_at, realtime publication, storage policies, RPC)

Fișiere modificate:

- `src/pages/UserTickets.tsx` — orchestrator nou (~120 linii).
- `src/components/support/SupportChatWidget.tsx` — refactor UI + integrare 4-step flow + realtime widget badge.
- `supabase/functions/support-ai-chat/index.ts` — state machine 4 pași + 2 tool-uri noi (`propose_category_chips`, `draft_ticket`).

Design system: tokeni semantici (`--primary` orange doar pe FAB / CTA principal / status pill cel mai urgent), 12px radius, Plus Jakarta Sans, framer-motion pentru animații, bilingual RO/EN via `useLanguage`.

## 7. Out of scope (Faza 1)

- Admin Support Operations 3-panel (`AdminTickets`, `AdminTicketDetail`).
- AI assist pentru admini (summarize, suggest reply, fraud detection).
- Automations (auto-assign, SLA cron, auto-close inactive).
- Analytics dashboard (response time, resolution time, AI resolved %).
- Push notifications native.

## Faza 2 (preview, NU se livrează acum)

Admin Support Operations Dashboard cu layout 3-panel (lista tickete / chat realtime / context user+rezervare+plăți+KYC), AI assist pe replies, internal notes redesign, SLA cron edge functions, analytics. Va fi planificată separat după validarea Fazei 1.
