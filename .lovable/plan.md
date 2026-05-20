## Ce am verificat

- `RentalPopupManager` e montat global în `src/App.tsx` (în `Suspense`), arată corect.
- Tabelul `rentals` este în publicația `supabase_realtime` cu `REPLICA IDENTITY FULL` și RLS-ul permite SELECT pentru renter și owner.
- RPC `get_rental_popups` arată ok și există o rezervare `pending` în baza de date (id `458f5edc...`, owner `74835c82...`) — popup-ul ar trebui să apară pentru acel owner la login / refresh.

## Probleme găsite

1. **Bug în `respond-rental-request`** — la refuz, edge function-ul setează `status='cancelled'`, `cancelled_at`, `rejection_reason`, dar **NU** setează `cancelled_by = owner_id`. Pop-up-ul pentru chiriaș (ramura „refuzat") depinde exact de condiția `cancelled_by = owner_id`, deci nu se mai declanșează niciodată. Toate rezervările recente cancelled din DB au `cancelled_by = NULL` — confirmă bug-ul.

2. **Pop-up de „confirmat" se poate pierde dacă rezervarea trece rapid de `confirmed`** — `get_rental_popups` filtrează strict `status = 'confirmed'`. Dacă între acceptare și deschiderea aplicației de către chiriaș, rezervarea ajunge la `active`/`completed` (ex. handover confirmat), chiriașul nu mai vede niciodată popup-ul, chiar dacă `renter_seen_confirmation = false`.

3. **Realtime sigur doar dacă chiriașul e online în acel moment** — dacă pierde evenimentul UPDATE și apoi rezervarea iese din `confirmed`, popup-ul e pierdut definitiv (combinat cu #2).

## Plan de remediere

### A. Setează `cancelled_by` la refuz (fix principal)

În `supabase/functions/respond-rental-request/index.ts`, în ramura `action !== "accept"` (linia ~152), adaugă:
```ts
updateData.cancelled_by = user.id;
```
Astfel, refuzul proprietarului satisface condiția RPC-ului și pop-up-ul „refuzat" apare la chiriaș.

### B. Mărește fereastra de afișare pentru chiriaș (pop-up „confirmat")

Modificare RPC `get_rental_popups` și `get_rental_popup_by_id`:
- Pentru ramura renter „confirmed", acceptă și statusurile ulterioare cât timp `renter_seen_confirmation = false` și `confirmed_at IS NOT NULL`:
  ```sql
  (r.renter_id = uid
   AND r.confirmed_at IS NOT NULL
   AND r.renter_seen_confirmation = false
   AND r.status IN ('confirmed','active'))
  ```
- Outcome rămâne `'confirmed'` în acest caz.

Astfel, chiriașul vede popup-ul chiar și dacă a fost offline când proprietarul a acceptat sau dacă procesul a avansat la `active`.

### C. (Opțional) Trigger pe acceptare pentru notificarea chiriașului

Realtime-ul deja funcționează; B acoperă cazul edge. Nu adaug nimic în plus.

## Fișiere atinse

- `supabase/functions/respond-rental-request/index.ts` — adăugare `cancelled_by`.
- Migrație SQL nouă pentru rescrierea funcțiilor `get_rental_popups` și `get_rental_popup_by_id`.
- Actualizare memorie `mem/features/rental-request-popup.md` cu noua semantică „confirmed | active".

## Verificare post-fix

1. Login ca owner `74835c82...` → popup-ul cu rezervarea pending `458f5edc...` trebuie să apară imediat.
2. Refuz dintr-un alt cont owner → reîncărcare ca chiriaș → popup „refuzat" apare.
3. Acceptare → ieșire chiriaș offline → refresh ulterior → popup „confirmat" încă apare (datorită extensiei la `active`).

## Confirmare necesară

Spune-mi cu ce cont ai testat (sau confirmă că vrei să aplic fix-urile așa cum sunt descrise) și implementez direct.