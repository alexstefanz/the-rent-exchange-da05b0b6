## Problem

După apăsarea "Acceptă"/"Refuză" în pop-up, butonul rămâne pe "Se trimite…" 5–10+ secunde. Cauza este în edge function-ul `respond-rental-request`: răspunsul către client e trimis abia după ce se termină **toate** operațiunile secundare:

1. Update `rentals` (rapid)
2. (la reject) apel Stripe `refunds.create` sau `paymentIntents.cancel` — sincron
3. 3× query-uri profile/produs
4. Insert notification + update transactions
5. `await Promise.all(emailPromises)` — 2 emailuri Resend (rețea externă)
6. `await supabaseAdmin.functions.invoke("notify-rental-event", …)` — încă un edge function (SMS + în-app)

Doar pasul 1 contează pentru UX-ul pop-up-ului. Restul sunt notificări/efecte colaterale care pot rula în background.

## Soluție (doar edge function, fără UI/business logic)

Refactor `supabase/functions/respond-rental-request/index.ts`:

1. **Calea critică sincronă** (rapid, sub ~500ms):
   - Validări auth + ownership + status
   - Update `rentals` cu noul status + `confirmed_at`/`cancelled_at`
   - Update `transactions` la accept
   - Insert `notifications` pentru chiriaș
   - Return `{ success: true, status }`

2. **Background via `EdgeRuntime.waitUntil(...)`** (nu blochează response-ul):
   - Stripe refund/cancel (la reject)
   - Fetch produs + profile owner/renter
   - Trimiterea celor 2 emailuri Resend
   - Apelul `notify-rental-event` (SMS + push)

Toate cele de mai sus deja sunt "best-effort" cu `.catch(...)` așa că ratarea lor nu trebuie să blocheze răspunsul.

Notă pentru Stripe la reject: mutăm refund-ul în background, dar setăm imediat `payment_status='refund_pending'` pe rental, iar la finalul refund-ului în background actualizăm la `refunded` + `refunded_at`. Asta păstrează UI-ul corect și debloacheză butonul.

## Verificare

- Deploy `respond-rental-request`.
- Apel `curl_edge_functions` pe o cerere de test + măsurare latency.
- În browser, click "Acceptă" pe un pop-up și verificat că starea "Se trimite…" durează <1s, iar emailul + SMS-ul tot ajung (verificat în `edge_function_logs` pentru `notify-rental-event`).