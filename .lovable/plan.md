## Probleme constatate

1. **Plata confirmată — proprietarul nu primește toast.** Evenimentul `payment_succeeded` se declanșează doar din `verify-stripe-payment` (apelată client-side de pagina `CheckoutSuccess`). Dacă chiriașul închide tabul Stripe înainte de redirect, evenimentul nu mai pleacă niciodată → proprietarul rămâne fără notificare. Trebuie un trigger fiabil pe inserarea rentalului „plătit", nu pe redirect.
2. **PV-uri completate — nu se anunță finalizarea ambelor semnături.** `PvSignatureDialog` trimite doar `pv_pickup_completed_by_party` / `pv_return_completed_by_party` (cealaltă parte). Când a doua semnătură vine, nu se trimite niciun eveniment „PV complet" către ambele părți.
3. **Returnare inițiată — proprietarul nu e notificat.** `initiateReturn()` apelează doar RPC-ul `initiate_return`, fără să trimită `return_in_progress` definit deja în `notify-rental-event`.
4. **Toast-urile nu sunt clickabile.** `notifyFromDb` ignoră câmpul `link` din rândul `notifications`, deci utilizatorul nu poate ajunge la pagina închirierii direct din toast (centrul de notificări mapează deja linkul corect).

## Plan de implementare

### A. Toast clickabil cu link (UI)
- `src/lib/notify.tsx`:
  - `NotifyOptions` și `NotificationToast` primesc `link?: string`.
  - Pe click pe card → `toast.dismiss(id)` + `window.location.assign(link)` (sau `navigate` printr-un helper global). Cursor `pointer` doar dacă există link.
  - `notifyFromDb(n)` propagă `n.link` către `show()`.
- `src/hooks/useGlobalRealtime.ts`: `ToastableNotification` include `link`, iar `pollRecent` selectează și coloana `link`.

### B. Notificare „PV complet"
- `src/components/rentals/PvSignatureDialog.tsx`, în `handleSign`, după ce detectăm că PV-ul are ambele semnături (`refreshed.owner_signature_data && refreshed.renter_signature_data`), invocăm încă un `notify-rental-event`:
  - pentru `phase === "handover"` → `event_key: "handover_confirmed"`
  - pentru `phase === "return"` → `event_key: "rental_completed"`
  - cu `actor_id: user?.id` ca să intre prin pipeline-ul standard (deduplicat în `notification_audit_log`).
- Ambele evenimente există deja în `notify-rental-event` cu `recipients: "both"` și link `/rezervari/{public_id}` ✔.

### C. Notificare „Returnare în curs"
- `src/features/rentals/rentalDetailPageApi.ts` → `initiateReturn(rentalId)`: după RPC-ul reușit, `supabase.functions.invoke("notify-rental-event", { body: { rental_id, event_key: "return_in_progress", actor_id: user.id } })` (fire-and-forget, `.catch` cu warn).

### D. Plata confirmată — fiabilizare către proprietar
- Adăugăm un trigger SQL pe `rentals` care, când `payment_status` trece în `authorized` sau `paid` (sau când `paid_at`/`authorized_at` devin non-null prima dată), inserează o singură notificare in-app către `owner_id` cu:
  - `type = 'payment_succeeded'`, `title_ro/en`, `description_ro/en` referind titlul produsului, `link = '/rezervari/' || public_id`.
  - Idempotent: `WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = NEW.owner_id AND type = 'payment_succeeded' AND link = '/rezervari/' || NEW.public_id)`.
- Avantaj: nu mai depinde de redirect-ul Stripe; webhook-ul / `verify-stripe-payment` doar setează coloanele, iar trigger-ul garantează toast-ul.
- Păstrăm și apelul existent din `verify-stripe-payment` (idempotent prin `notification_audit_log`), ca să continue să trimită email-ul.

### E. Verificare
- După deploy: test manual cu o închiriere în sandbox — verificăm că:
  1. La plata cu cardul de test, proprietarul vede toast „Plata a fost confirmată" cu click pe `/rezervari/RNT-…`.
  2. Când a doua parte semnează PV de predare → ambele părți primesc „Predarea a fost confirmată".
  3. Când chiriașul apasă „Inițiază returnarea" → proprietarul primește „Returnare în curs".
  4. Toate toast-urile se închid și navighează la `/rezervari/{public_id}` la click.

### Detalii tehnice
- Migrație nouă: funcție `public.notify_owner_payment()` + trigger `AFTER UPDATE ON rentals` (când `payment_status` devine `authorized`/`paid`) și `AFTER INSERT` (pentru cazul în care rentalul e creat direct plătit). RLS rămâne nemodificată (insert pe `notifications` se face cu `SECURITY DEFINER`).
- Niciun edge function nou; toate evenimentele existente sunt deja configurate cu link `/rezervari/{public_id}`.
