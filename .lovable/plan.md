
## Schimbarea modelului de anulare

În prezent, anularea funcționează "mutual" (cealaltă parte aprobă direct). Trecem la un model **admin-mediat**: orice parte trimite o cerere → adminul o vede în "Confirmări / Anulări" → aprobă (face refundul) sau respinge.

Disponibilitatea cererii rămâne până la **semnarea primului proces verbal** (`handover_pv_owner_signed_at IS NULL`) — deja validat în RPC.

## Modificări de bază de date

Adăugăm pe `rentals`:
- `cancel_request_subject` (text) — subiectul cererii
- `cancel_request_admin_id` (uuid) — adminul care a procesat
- `cancel_request_admin_note` (text) — nota internă

Statusurile `cancel_request_status` rămân: `pending`, `approved`, `rejected`, `withdrawn` — dar sunt setate de admin (nu de cealaltă parte).

Update RPC `request_mutual_cancellation` → acceptă și `_subject`. Înlocuim `respond_mutual_cancellation` cu `admin_respond_cancellation(_rental_id, _action, _note)` care verifică `has_role(uid, 'admin')`.

Refundul Stripe rămâne în edge-function-ul existent `mutual-cancel-rental`, apelat de admin la aprobare.

## Frontend chiriaș/proprietar

`src/components/rentals/MutualCancellationCard.tsx`:
- Formularul de cerere primește un câmp **Subiect** (text scurt obligatoriu, min 3 caractere) deasupra motivului.
- Stările "iAmRecipient" / "iAmInitiator" sunt înlocuite cu o singură stare informativă: **„Cerere trimisă către admin pentru revizuire"** cu subiect, motiv, dată; butonul "Retrage" rămâne disponibil pentru inițiator cât timp `pending`.
- Eliminăm UI-ul de aprobă/refuză din partea utilizatorului final.

`src/features/rentals/rentalsApi.ts`:
- `requestMutualCancellation(rentalId, subject, reason)` — semnătură nouă.
- `withdrawCancellationRequest(rentalId)` — pentru inițiator.
- Eliminăm `respondMutualCancellation` din UI client.

Mesaj de eroare clar dacă RPC-ul respinge (afișarea actuală „Eroare la trimitere" e cauza pentru care „nu funcționează"; după corecția semnăturii + subiect, validarea va trece).

## Admin: tab „Confirmări / Anulări"

Redenumim sidebar item-ul `Confirmări` → `Confirmări / Anulări` (`src/components/admin/AdminSidebar.tsx`).

În `src/pages/admin/AdminApprovals.tsx` adăugăm un **Tabs** cu două secțiuni:
1. **Produse** — UI existent neschimbat.
2. **Anulări rezervări** — listă cu cereri `pending` (sortate după `cancel_request_created_at` desc).

Pentru fiecare cerere afișăm:
- Produs (titlu + thumbnail), public ID rezervare (`RNT-XXXXXX`), perioadă, sumă.
- Inițiator (chiriaș/proprietar) cu nume + rol.
- Subiect, motiv complet.
- Acțiuni: **Aprobă anularea** (rulează edge function `mutual-cancel-rental` → refund integral), **Respinge** (cu notă opțională), **Contactează chiriașul**, **Contactează proprietarul** (deschid `/messages?user=<id>` sau echivalent în messaging existent).
- Badge cu vechimea cererii pentru SLA vizibil.

Edge function `mutual-cancel-rental`: înlocuim verificarea `cancel_request_status = 'approved'` cu apelarea de către admin (verifică rol admin în loc de status mutual). Setează `cancel_request_status = 'approved'` + `cancel_request_admin_id` + execută refundul Stripe ca acum.

## Notificări

`notify-rental-event` capătă cheile noi:
- `cancel_request_submitted` — email admin + ambele părți („cererea ta este în revizuire").
- `cancel_request_approved` — ambele părți.
- `cancel_request_rejected` — ambele părți (cu nota adminului).
- `cancel_request_withdrawn` — ambele părți.

(Template-uri reutilizate din cele existente cu text actualizat — fără șabloane noi pentru moment dacă timpul presează.)

## Out of scope

- Nu schimbăm logica de refund (rămâne integrală inclusiv comision la aprobare).
- Nu modificăm fluxul post-handover (PV semnat → cererea de anulare nu mai e disponibilă, deja blocată).
- Nu schimbăm `RentalsTab` / `RentalsOutTab` în afară de butonul existent care apelează `requestMutualCancellation` cu noua semnătură (subject).

## Tehnic — fișiere atinse

- Migrație: noi coloane + RPC `admin_respond_cancellation` + update `request_mutual_cancellation`.
- `src/features/rentals/rentalsApi.ts` — semnături noi.
- `src/components/rentals/MutualCancellationCard.tsx` — câmp subiect + UI simplificat.
- `src/components/dashboard/RentalsTab.tsx`, `RentalsOutTab.tsx` — dialogul "Solicită anularea" primește subject.
- `src/pages/admin/AdminApprovals.tsx` — Tabs + secțiunea anulări.
- `src/components/admin/AdminSidebar.tsx` — titlu redenumit.
- `src/features/admin/` — nou `cancellationRequestsApi.ts` (listare + acțiuni admin).
- `supabase/functions/mutual-cancel-rental/index.ts` — verificare rol admin.
