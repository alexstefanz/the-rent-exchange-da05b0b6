## Problemă

`FORBIDDEN` apare la apăsarea „Da, anulează" pentru că ești logat cu un cont care nu e nici `renter_id` nici `owner_id` al rezervării (probabil contul tău de admin). RPC-ul `cancel_unpaid_rental` aruncă `FORBIDDEN` în acest caz, iar cardul „Anulează rezervarea" se afișa oricui deschide pagina (inclusiv admini / utilizatori străini).

## Fix

1) **DB — extinde `cancel_unpaid_rental`** să accepte și adminii (via `has_role(auth.uid(),'admin')`). Când actorul e admin, `cancellation_reason='admin_self_unpaid'`. Restul logicii (status, handover, payment_status) rămâne neschimbat.

2) **UI — `MutualCancellationCard`**: ascunde complet cardul când utilizatorul curent nu e renter, nu e owner și nu e admin. Adaug prop `isAdmin` calculat în `RentalDetailPage` din `useUserRole`/sursa existentă. Dacă e admin, dialogul afișează un mesaj diferit: „Anulezi ca admin. Ambele părți vor fi notificate."

3) **`RentalDetailPage`** — pasează `isAdmin` și include condiția în gate-ul de rendering: `(isRenter || isOwner || isAdmin) && ...`.

## Out of scope

Fluxul „request mutual cancellation" rămâne neschimbat. Nu modific notificările sau emailurile existente — adminul declanșează aceleași notificări ca utilizatorii.
