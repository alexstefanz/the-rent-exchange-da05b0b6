## Reducere email-uri proprietar + fix duplicat

### Scop
Proprietarul primește prea multe email-uri (8) pentru un flux de închiriere. Reducem la doar 3 email-uri și eliminăm cauza duplicatului "Predarea a fost confirmată".

### Email-uri păstrate pentru proprietar
1. `request_created` → "Cerere nouă de închiriere"
2. `handover_confirmed` → "Predarea a fost confirmată"
3. `rental_completed` → "Închirierea ta a fost finalizată"

### Email-uri eliminate pentru proprietar (rămân doar in-app + SMS unde e cazul)
- `request_accepted` ("Ai acceptat o cerere")
- `pv_pickup_pending` ("Acțiune necesară: completează partea ta din PV")
- `pv_pickup_completed_by_party`
- `pv_return_pending` ("Acțiune necesară: PV de returnare")
- `pv_return_completed_by_party`
- `return_in_progress`
- `return_reminder_24h`, `return_reminder_2h`
- `request_reminder_2h`, `request_expired`
- `pickup_scheduled`
- `dispute_opened`, `cancellation-*`

Pentru renter (chiriaș) păstrăm comportamentul actual neschimbat.

### Implementare
În `supabase/functions/notify-rental-event/index.ts`:
- Adăugăm o constantă `OWNER_EMAIL_ALLOWED = new Set(["request_created","handover_confirmed","rental_completed"])`.
- În bucla `for (const role of recipients)`, înainte de blocul EMAIL, dacă `role === "owner" && !OWNER_EMAIL_ALLOWED.has(event_key)` → audit_log status `skipped` cu reason `owner_email_filtered` și skip trimitere. Toate celelalte canale (in_app, SMS) rămân.

### Fix duplicat "Predarea a fost confirmată"
Cauză: `handover_confirmed` este invocat simultan din 2 surse:
1. Client (`src/features/rentals/rentalDetailPageApi.ts` linia 258, `src/features/rentals/ownerRentalsApi.ts` linia 81)
2. DB trigger `rentals_notify_status` (migrație `20260511053841`)

Verificarea de idempotență din funcție citește `notification_audit_log` înainte de insert — race condition: ambele invocări trec verificarea simultan și trimit email-ul de 2 ori.

**Soluție:**
- Eliminăm cele 2 apeluri din client (`rentalDetailPageApi.ts` și `ownerRentalsApi.ts`). DB trigger-ul e sursa unică de adevăr și se declanșează atomic la `UPDATE rentals SET handover_confirmed_at = now()`.
- Adăugăm protecție defensivă: migrație care creează `UNIQUE INDEX` parțial pe `notification_audit_log(rental_id, event_key, user_id, channel) WHERE status IN ('sent','delivered')` pentru a preveni viitoare race conditions. În funcție, prindem erori `23505` (unique violation) la insertul audit log-ului și tratăm trimiterea ca duplicat (nu repornim send-ul).

### Verificare
- După deploy, verificare manuală prin a urmări un flux complet și confirma că proprietarul primește exact 3 email-uri.
- Verificare în `notification_audit_log` că pentru `handover_confirmed` există un singur rând per user.

### Fișiere modificate
- `supabase/functions/notify-rental-event/index.ts` — filtru owner emails + retry safe pe unique violation
- `src/features/rentals/rentalDetailPageApi.ts` — eliminare apel client `handover_confirmed`
- `src/features/rentals/ownerRentalsApi.ts` — eliminare apel client `handover_confirmed`
- migrație nouă — unique index pe `notification_audit_log`
- deploy `notify-rental-event`

### Out of scope
- Templatele email-urilor în sine (nu modificăm conținut).
- Notificările in-app și SMS — rămân neschimbate.
- Email-urile către chiriaș.
