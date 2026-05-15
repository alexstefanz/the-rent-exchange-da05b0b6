## Obiectiv
Adminii să vadă **același FAB** și aceeași fereastră ca userii (același `MessageCircle`, taburi „Chat" + „Tickete", header și stil identic), cu o singură diferență funcțională: tab-ul **Tickete** afișează inbox-ul cu **toate ticketele clienților** și permite adminului să răspundă (mod intern + escaladare status). Tab-ul **Chat** rămâne identic — conversațiile user↔user proprii (adminul e și user).

## Stare curentă
- `SupportChatWidget` (FAB portocaliu MessageCircle) — afișat tuturor non-admin, ascuns pe `/admin`.
- `AdminSupportWidget` (FAB alb cu border portocaliu, iconiță `Headphones`, panel cu header portocaliu solid) — afișat doar adminilor, fără tab Chat user↔user.
- Ambele sunt mount-ate în `App.tsx`.

## Plan

### 1. `SupportChatWidget` devine role-aware
- Detectez rolul de admin: `useQuery` care apelează `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })`. Cache `["isAdmin", user?.id]`.
- Elimin gard-ul `if (isAdminRoute) return null;` — widget-ul apare și pe paginile `/admin`.
- FAB-ul rămâne identic (MessageCircle, primary). Badge-ul însumează:
  - non-admin: `totalUnread (chats) + openTicketsCount (own tickets)`.
  - admin: `totalUnread (chats) + adminInboxUnread + adminInboxNewCount`.

### 2. Tab „Chat" — neschimbat
Pentru ambele roluri folosește același `getConversations()` + `ChatPanel` inline.

### 3. Tab „Tickete" — branch după rol
- **Non-admin** (comportament actual neschimbat): welcome screen + creează automat ticket la primul mesaj; back arată tickete anterioare.
- **Admin**: tab-ul devine **inbox global**:
  - **Listă**: încarc `fetchOpsTickets()` filtrat pe statuse active (`NEW`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `WAITING_OWNER`, `WAITING_INTERNAL`); pentru fiecare ticket calculez `unread_count` (mesaje CUSTOMER după `last_admin_read_at`) și `last_message`. Sortare: `NEW` first → unread → `updated_at` desc. Realtime via canalele existente (`ops_tickets`, `ops_ticket_messages`).
  - **Item**: `public_id` + status pill + titlu + ultim mesaj + badge unread, în stilul cardurilor existente din widget.
  - **Conversație ticket**: același container UI (header widget cu ←, lista mesaje în bubble-uri amber/muted, input + image upload). Diferențe pentru admin:
    - Trimitere prin `createTicketMessage(ticketId, text, isInternal, "ADMIN")` în loc de `addUserTicketMessage`.
    - Toggle `Switch` „Notă internă" în input bar (afișat doar pentru admin); când e on, mesajul nu e vizibil clientului și bubble-ul se randează cu fundal galben pal + iconiță `Lock`.
    - La deschiderea ticketului: `update ops_tickets.last_admin_read_at = now()` (RPC actuală).
    - Sub header (subtitle): pe lângă `public_id`, afișez `requester_user_id` resolved la nume (fetch lazy din `profiles`) — sau lăsăm doar titlul ticketului ca subtitle pentru simplitate.
  - **Welcome screen** (mesaj prescris „Echipa Rentli") **NU** apare la admin — adminul intră direct în listă; doar dacă inboxul e gol arată empty state „Niciun ticket activ".

### 4. Eliminare `AdminSupportWidget`
- Șterg `src/components/admin/AdminSupportWidget.tsx`.
- Elimin importul + `<AdminSupportWidget />` din `src/App.tsx`.

### 5. Detalii tehnice
- Importuri noi în `SupportChatWidget`: `fetchOpsTickets`, `fetchTicketMessages`, `createTicketMessage`, `STATUS_OPTIONS` din `@/features/admin/opsTicketsApi`; `Switch` din `@/components/ui/switch`; `Lock` din `lucide-react`.
- Reutilizez state-ul existent (`ticketId`, `messageText`, `isUploadingImage`, etc.); adaug `isInternal: boolean` doar pentru admin.
- Realtime admin: sub-canal pe `ops_tickets` + `ops_ticket_messages` activ doar când `isAdmin && isOpen && activeTab === "tickets"`. Invalidează `["adminOpsInbox"]`.
- FAB: continui să se ascundă pe `/mesaje` doar pe mobil (deja e cazul).

### Out of scope
- `AdminSupportAnalytics`, schemă DB, RLS pe `ops_tickets`/`ops_ticket_messages`, `Messages.tsx`, ChatPanel.
- Filtre avansate (asignare, categorii) în inboxul admin — lăsăm pe AdminTickets full page.

## Recap
Un singur widget `SupportChatWidget` cu același FAB MessageCircle pentru toți. Branch intern după rol în tab-ul Tickete: client = chat direct cu echipa, admin = inbox cu replicare/răspuns. `AdminSupportWidget` se șterge.
