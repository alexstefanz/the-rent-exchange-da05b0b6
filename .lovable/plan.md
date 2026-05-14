## Scope

Two changes pe panoul `Anulări rezervări` din `/admin/approvals`:

1. **Butoane „Chat chiriaș" / „Chat proprietar"** — funcționale și robuste
2. **La Aprobă** — se deschide automat un ticket operațional pentru refund, iar statusul ticketului se actualizează când refund-ul Stripe este efectiv procesat.

Restul fluxului existent (RPC `admin_respond_cancellation` + edge `mutual-cancel-rental` care face void/refund pe Stripe) rămâne neschimbat.

---

## 1. Chat chiriaș / Chat proprietar

Butoanele apelează deja `openAdminConversation` din `cancellationRequestsApi.ts`, dar au două probleme:

- `conversations.product_id` este **NOT NULL**; dacă o cerere nu are produs (rar, dar posibil), insertul cade silențios.
- Admin-ul deschide o conversație nouă `buyer_id = admin, owner_id = otherUser`, însă lookup-ul existent caută doar după `(buyer_id, owner_id, product_id)` — nu reutilizează o conversație deja existentă cu `rentals_id` setat.

Modificări în `src/features/admin/cancellationRequestsApi.ts → openAdminConversation`:

- Dacă există deja o conversație cu `rentals_id = rentalId` și `(buyer_id = adminId AND owner_id = otherUserId)` sau invers → returnează acel id.
- Altfel: dacă `productId` lipsește, încarcă-l din `rentals` înainte de insert (necesar pentru NOT NULL).
- Insert cu `buyer_id = adminId`, `owner_id = otherUserId`, `product_id`, `rentals_id`. Toast clar pe eroare.

Navigația rămâne `navigate(\`/messages?conversation=<id>\`)`.

---

## 2. Auto-creare ticket refund la aprobare

La aprobare admin (`adminApproveCancellation`) se va crea un ticket `ops_tickets` legat de rezervare, înainte de a apela `mutual-cancel-rental`.

**Conținut ticket:**
- `category_group = 'FINANCIAL'`, `category_type = 'REFUND_REQUEST'`
- `priority = 'HIGH'`
- `tags = ['cancel-refund', 'auto']`
- `reservation_id = rentalId`, `product_id`, `requester_user_id` = inițiator (renter/owner), `rental_user_id`, `owner_user_id` din rental
- `title`: „Refund anulare RNT-XXXXXX"
- `description`: include subiect + motiv din cererea de anulare, sumele (subtotal + comision), inițiator, status plată curent
- `status` inițial = `'IN_PROGRESS'` (refund-ul se procesează imediat după)

Pentru a evita dubluri pe re-click sau race-condition, folosim un index unic deja existent compatibil sau adăugăm o verificare: înainte de insert, caută un ticket activ cu `reservation_id = rentalId AND 'cancel-refund' = ANY(tags) AND status NOT IN ('CLOSED','RESOLVED')`. Dacă există, refoloseşte-l.

**Update status după refund:**

`mutual-cancel-rental` returnează `{ ok: true, payment_status: 'voided' | 'refunded' }`. După apelul edge function reușit, în `adminApproveCancellation`:

- Setează `ops_tickets.status = 'RESOLVED'`, `closed_at = now()` și adaugă un mesaj public:
  - „Refund procesat automat: status plată = voided" (hold anulat înainte de capture), sau
  - „Refund procesat automat: status plată = refunded" (suma completă întoarsă chiriașului)
- Audit log: `REFUND_COMPLETED`.

Dacă edge function eșuează → ticketul rămâne `IN_PROGRESS` și se adaugă mesaj cu eroarea, plus audit `REFUND_FAILED`. Adminul poate interveni manual.

---

## Detalii tehnice

**Fișiere modificate:**
- `src/features/admin/cancellationRequestsApi.ts`
  - `openAdminConversation`: lookup după `rentals_id`, fallback fetch `product_id` din rental.
  - `adminApproveCancellation`: înfășoară fluxul cu create ticket → call mutual-cancel → update ticket (toate via `opsTicketsApi` helpers existenți: `createOpsTicket`, `updateOpsTicketField`, `createTicketMessage`).
- `src/components/admin/AdminCancellationRequestsPanel.tsx`
  - Toast după approve: „Anulare aprobată. Ticket TCK-XXXXXX creat și refund procesat." cu link spre `/admin/tickets/<id>` (dacă există ruta).

**Niciun migration nou** — `ops_tickets` are deja toate coloanele necesare; `conversations` schema este suficientă.

**Verificare după implementare:**
- Click pe Chat chiriaș/proprietar → se deschide `/messages?conversation=...` cu conversația aferentă rentalului.
- Click pe Aprobă → toast cu TCK code, ticketul apare în Admin > Tickets cu mesaj „Refund procesat".
