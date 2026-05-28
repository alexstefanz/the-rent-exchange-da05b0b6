## Cauza erorii

Utilizatorul (renter) apasă **„Confirmă primirea bunului"** → frontendul cheamă RPC-ul `confirm_handover_received` (SECURITY DEFINER) care face:
```sql
UPDATE rentals SET handover_confirmed_at = now(), status = 'active' WHERE id = ...
```

Pe acest UPDATE se declanșează trigger-ul `lock_renter_rental_update`. Trigger-ul verifică `auth.uid()` — care **rămâne renter-ul** chiar și în SECURITY DEFINER (e luat din JWT, nu din rolul Postgres) — și respinge orice modificare la `handover_confirmed_at`. De aici mesajul *„Renters can only cancel their pending rentals; financial / state columns are read-only"*.

Aceeași problemă va apărea la orice alt RPC sigur care mută renter-ul printr-un câmp blocat (ex: viitoare `confirm_return_received`, early return, etc.).

## Soluție

Pattern standard cu **flag de sesiune** (GUC): RPC-urile sigure setează un flag înainte de UPDATE, iar trigger-ul îl respectă și permite trecerea.

### 1. Migrație (un singur fișier)

- Rescrie funcția `lock_renter_rental_update` să facă **early return** dacă `current_setting('app.bypass_renter_lock', true) = 'on'`, înainte de toate celelalte verificări (după service_role / admin / owner check, ca să nu compromită ownerul).
- Rescrie `confirm_handover_received` (SECURITY DEFINER) ca să apeleze `PERFORM set_config('app.bypass_renter_lock','on', true);` (true = scope la tranzacția curentă) chiar înainte de `UPDATE rentals ...`. După UPDATE nu mai e necesar reset, scope-ul e local.
- Toate celelalte verificări de business din RPC (renter check, status check, PV signed check) rămân neschimbate — bypass-ul ocolește doar trigger-ul anti-tampering, nu logica RPC.

### 2. Nu modific frontend

Codul client (`confirmHandoverReceived` în `rentalDetailPageApi.ts`) e corect — apelează RPC-ul. Nu necesită modificări.

### 3. Audit & curățare în aceeași migrație

- `ownerRentalsApi.ts → confirmHandover` (linia 78) face un `.update` direct din client cu `handover_confirmed_at + status='active'`. Folosit doar în `InspectionDialog` din **owner flow** → `auth.uid() = owner_id` → trigger-ul are deja early-return pentru owner, deci e OK, nu schimb nimic.
- `ownerRentalsApi.ts → confirmReturn` (linia 104) updatează `return_confirmed_at, status='completed', completed_at` — apelat tot din `InspectionDialog`. Acest dialog e deschis și de renter? Verific în implementare: dacă da, e o a doua sursă a aceluiași bug și mut și acest update într-un RPC SECURITY DEFINER `confirm_return_received` cu același pattern de bypass. Dacă e doar owner, las neschimbat.

### 4. Verificare

- Curl test pe RPC-ul `confirm_handover_received` cu sesiune renter pe o rezervare reală pending+pv-signed → trebuie să returneze success și să mute statusul în `active`.
- Verific în loguri Postgres că nu mai apare excepția `Renters can only cancel...`.

## Detalii tehnice

```text
┌─ Renter apasă "Confirmă primirea"
│
├─→ supabase.rpc('confirm_handover_received', { _rental_id })
│       │
│       ├─ verifică renter, status, PV semnat
│       ├─ set_config('app.bypass_renter_lock','on', true)   ◄── NOU
│       └─ UPDATE rentals SET handover_confirmed_at, status='active'
│              │
│              └─→ trigger lock_renter_rental_update
│                     │
│                     ├─ service_role? admin? owner? → exit
│                     ├─ bypass flag = 'on'? → exit ◄── NOU
│                     └─ ... (verificările existente)
```

Flag-ul cu scope tranzacțional (al 3-lea argument `true` la `set_config`) garantează că nu „scapă" în alte sesiuni / conexiuni din pool.

## În afara scopului

- Nu schimb politicile RLS pe `rentals` — sunt corecte.
- Nu modific logica de cancel a renter-ului — funcționează.
- Nu refactorez `InspectionDialog` decât dacă auditul de la pasul 3 arată că e folosit și de renter pentru `return_confirmed_at`.
