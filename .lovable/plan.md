## Goal

Adminul trebuie să poată închide / marca un ticket direct din widget-ul de suport (`SupportChatWidget.tsx`), fără să meargă în ERP-ul de admin. Acțiunile disponibile: **Rezolvat**, **Necesită investigații suplimentare**, **Anulat** (plus rămâne și redeschiderea, dacă userul revine cu mesaj).

## Mapare pe statusurile existente

Schema `ops_tickets` are deja enumul: NEW, IN_PROGRESS, WAITING_CUSTOMER, WAITING_OWNER, WAITING_INTERNAL, RESOLVED, CLOSED. Pentru a evita migrare DB:

- **Rezolvat** → `RESOLVED` (trimite și email "ticket-resolved" prin logica existentă).
- **Necesită investigații suplimentare** → `WAITING_INTERNAL` (ticket-ul rămâne deschis, dar marcat).
- **Anulat** → `CLOSED` + notă internă auto "Anulat de admin" (sau cu motiv opțional). Folosește `closed_at` deja setat de `updateOpsTicketField`.

Audit log-ul actual ("STATUS_CHANGED") rămâne neschimbat. Eticheta "Anulat" e doar UI — în DB este `CLOSED`.

## Schimbări UI (`SupportChatWidget.tsx`)

1. **Header admin pe ticket activ**: lângă butonul X, adăugăm un buton "Acțiuni" (icon `MoreVertical` sau `CheckCircle`) care deschide un `DropdownMenu` (shadcn) cu 3 opțiuni:
   - Marchează rezolvat
   - Necesită investigații
   - Anulează ticket
2. Click pe oricare → `AlertDialog` de confirmare cu textul potrivit (ireversibil pentru "Anulat" / "Rezolvat", reversibil pentru "Necesită investigații").
3. Pe confirm:
   - Apel `updateOpsTicketField(ticketId, 'status', oldStatus, newStatus, 'STATUS_CHANGED')` din `opsTicketsApi`.
   - Pentru "Anulat", trimitem suplimentar un mesaj de tip internal note ("Ticket anulat de admin") prin `createTicketMessage(ticketId, text, true, 'ADMIN')`.
   - Invalidate query-urile: `["supportTicketInfo", ticketId]`, `["supportChatMessages", ticketId]`, `["adminOpsInbox"]`, `["opsTickets"]`.
   - Toast de succes.
4. **Comportament după acțiune**:
   - `RESOLVED` / `CLOSED` → `isClosed` devine true → input-ul existent se ascunde și apare deja banner-ul "Acest ticket a fost închis" (logica e prezentă). Adminul se întoarce la inbox cu back.
   - `WAITING_INTERNAL` → ticket-ul rămâne deschis, header-ul afișează status nou (folosim `StatusPill` din header dacă vrem; opțional).
5. Butonul nu apare pentru useri non-admin, nu apare pentru tickete deja `RESOLVED`/`CLOSED`.

## Fișiere atinse

- `src/components/support/SupportChatWidget.tsx` — meniu acțiuni admin + dialog confirmare + mutații.
- Niciun fișier API nou: refolosim `updateOpsTicketField` și `createTicketMessage` din `src/features/admin/opsTicketsApi.ts`.

## Out of scope

- Fără modificări de schemă DB (nu adăugăm status `CANCELLED` dedicat; tratarea e prin etichetă + audit).
- Fără modificări la pagina admin ERP `AdminTicketDetail` — selectul de status de acolo rămâne sursa de adevăr exhaustivă.
