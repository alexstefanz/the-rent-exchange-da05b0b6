## Problema

La trimiterea cererii de anulare apare eroarea `column "handover_pv_owner_signed_at" does not exist`.

RPC-ul `request_mutual_cancellation` referă o coloană inexistentă în tabela `rentals`. Coloana corectă este `handover_confirmed_at` (singura coloană `handover_*` care există). În plus, există două versiuni suprascrise ale funcției (cu și fără `_subject`), iar PostgREST poate apela varianta veche, care în plus nu cere subiect.

## Migrație

1. `DROP FUNCTION public.request_mutual_cancellation(uuid, text);` — eliminăm versiunea veche fără subiect, ca să rămână doar semnătura `(uuid, text, text)` apelată de UI.
2. `CREATE OR REPLACE FUNCTION public.request_mutual_cancellation(_rental_id uuid, _reason text, _subject text)` — aceeași logică, dar:
   - se selectează `handover_confirmed_at` în loc de `handover_pv_owner_signed_at`
   - condiția devine `IF r.handover_confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'handover_signed'`
   - `_subject` devine obligatoriu (fără DEFAULT) cu min 3 caractere.
3. Aceeași corecție pentru `admin_respond_cancellation` și `withdraw_cancellation_request` dacă au aceeași referință greșită — verific și înlocuiesc.

## Fără modificări de UI

Frontendul (`MutualCancellationCard`, `RentalsTab`, `RentalsOutTab`) trimite deja `subject` + `reason`, deci după migrație totul funcționează. Nu e nevoie de schimbări în client.
