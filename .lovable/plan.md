Adaug o secțiune de arhivă la "Anulări rezervări" în Admin > Confirmări / Anulări, ca să rămână istoricul cererilor aprobate și respinse după ce sunt procesate.

Pași:

1. **Migrație DB** — adaug un nou RPC `list_resolved_cancellation_requests()` (admin-only, SECURITY DEFINER) care întoarce cererile cu `cancel_request_status IN ('approved','rejected')`, ordonate descrescător după `cancel_request_responded_at`. Returnează aceleași coloane ca RPC-ul existent + `cancel_request_status`, `cancel_request_responded_at`, `cancel_request_admin_note`, `cancel_request_response_note`.

2. **API frontend** — în `src/features/admin/cancellationRequestsApi.ts` adaug:
   - tip `ResolvedCancellationRequest` (extinde câmpurile de mai sus),
   - `listResolvedCancellationRequests()` care cheamă noul RPC.

3. **UI panel** — în `src/components/admin/AdminCancellationRequestsPanel.tsx`:
   - Înlocuiesc lista plată cu două sub-tab-uri interne: **„În așteptare"** (lista actuală) și **„Arhivă"**.
   - Arhiva afișează aceleași carduri (imagine, titlu, RNT-XXXXXX, datele rezervării, sume, inițiator, subiect, motiv) + un badge de status (verde „Aprobată" / roșu „Respinsă"), data deciziei, și nota admin/răspuns dacă există.
   - Butoanele „Aprobă/Respinge" sunt înlocuite în arhivă cu butoanele de chat (chiriaș/proprietar) deja existente, plus un buton „Vezi tichet" dacă rezervarea are un ticket de refund asociat (link la `/admin/tickets?ticket=<public_id>`).
   - Caut ticketul prin `ops_tickets` cu `reservation_id = rental_id` și tag `cancel-refund`, într-o singură interogare batch după rentalIDs.

4. **Realtime / cache** — la `adminApproveCancellation` și `adminRejectCancellation` invalidez și `["admin-cancellation-requests-archive"]`, ca arhiva să se actualizeze imediat.

Detalii tehnice:
- Coloanele există deja pe `rentals` (`cancel_request_status`, `cancel_request_responded_at`, `cancel_request_admin_note`, `cancel_request_response_note`, `cancel_request_admin_id`).
- Nu sunt necesare modificări la flow-ul de aprobare/respingere, doar la afișare.
- Arhiva e read-only.