# Fallback predare: auto-confirmare după 24h

## Problemă
Când PV-ul de predare e semnat de ambele părți dar chiriașul nu apasă "Confirm primirea" (eroare, uitare, telefon descărcat), rezervarea rămâne blocată în statusul `confirmed` cu `handover_confirmed_at = NULL`. Owner-ul vede la nesfârșit "Așteptăm confirmarea chiriașului" și produsul nu trece în `active`.

## Soluție
Un cron job rulează zilnic și auto-confirmă predarea pentru rezervările unde:
1. `handover_confirmed_at IS NULL`
2. `status IN ('confirmed','active')`
3. PV-ul `handover` are atât `owner_signed_at` cât și `renter_signed_at`
4. Cea mai recentă semnătură PV este mai veche de **24h**

## Implementare

### 1. Migrație: RPC `auto_confirm_overdue_handovers()`
- `SECURITY DEFINER`, owner `postgres`, fără parametri.
- `GRANT EXECUTE ... TO service_role` (apelată doar din edge function).
- Setează `app.bypass_renter_lock = 'on'` (același mecanism ca `confirm_handover_received`) ca să treacă de trigger-ul `lock_renter_rental_update`.
- `UPDATE rentals SET handover_confirmed_at = now(), status = 'active'` pentru toate rezervările care îndeplinesc condițiile, returnând `SETOF uuid` cu ID-urile actualizate.
- Logare în `audit_log` / `user_activity_logs` cu motiv `auto_handover_24h` (folosim tabela existentă pentru audit, fără tabel nou).

### 2. Edge function `auto-confirm-handovers`
- `verify_jwt = false` (apelată de cron prin `pg_net`).
- Validează header `Authorization: Bearer <CRON_SECRET>` (env var nou) ca anon-ul să nu o poată apela.
- Apelează RPC-ul cu `service_role` și pentru fiecare ID returnat trimite un eveniment către `notify-rental-event` cu tip nou `handover_auto_confirmed` (notificare in-app + email pentru owner și chiriaș, fără SMS — conform regulilor curente).

### 3. Cron job
- Programat la fiecare oră (`0 * * * *`) prin `pg_cron` + `pg_net` (inserat cu insert tool, nu migrație, pentru că include URL + anon key).
- POST către `/functions/v1/auto-confirm-handovers` cu `Authorization: Bearer <CRON_SECRET>`.

### 4. Frontend
- În `RentalDetailPage.tsx`, sub butonul galben "Așteptăm confirmarea chiriasului", adăugăm un text informativ:
  > „Dacă chiriasul nu confirmă în 24h de la semnarea PV-ului, predarea este confirmată automat."
- Pentru chiriaș, sub `Pasul 4`, mesaj similar pentru transparență.
- Bilingv prin `uxCopy.ts`.

## Verificare
1. Migrația rulează curat și RPC-ul are GRANT corect.
2. Apel manual la edge function cu header valid → vede în log câte rezervări a actualizat.
3. Verificare în DB că pentru o rezervare cu PV semnat de >24h, `handover_confirmed_at` și `status='active'` sunt setate.
4. Vedem notificările `handover_auto_confirmed` în inbox pentru ambele părți.
