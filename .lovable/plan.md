# Cereri primite — fix counts, add "Întârziate", smart status badge

Trei probleme observate în poză:

1. **Total greșit**: `Toate (14)` dar suma celorlalte = 9+3+1+0+0 = 13. Există rezervări care nu intră în niciun bucket din dropdown.
2. **Lipsește categoria "Întârziate"**: rezervări la care termenul a trecut dar n-au fost finalizate/anulate nu apar în nicio categorie afară de "Toate".
3. **Badge static "Confirmată" verde** chiar și când termenul de predare/returnare a trecut deja — induce în eroare.

## Fix-uri

### 1. `src/components/dashboard/RentalsOutTab.tsx` — partiție exhaustivă + bucket "Întârziate"

Refactor `counts` + `matchesStatus` cu un helper unic `bucketOf(rental) → RentalStatusFilter` ca să garantăm că **fiecare rezervare aparține exact unui bucket** (suma = Toate).

Reguli noi (în ordine, prima care match-uiește câștigă):
- `cancelled` → status în `cancelled` / `rejected`
- `completed` → status `completed` SAU (confirmed/active + `return_confirmed_at`)
- `overdue` (nou — **Întârziate**) → status în `confirmed` / `active`, neanulat, nereturnat, ȘI `end_date < azi`
- `in_progress` → confirmed/active + `handover_confirmed_at` setat (și nereturnat)
- `active` → confirmed/active fără handover, end_date ≥ azi
- `pending` → status `pending`
- fallback `other` (nu ar trebui să apară; loghez `console.warn` cu id-ul ca să prindem cazurile noi)

`counts.all` = `rentals.length` și `counts[bucket] = rentals.filter(r => bucketOf(r) === bucket).length` → suma celor 6 buckete = total garantat.

### 2. `src/components/dashboard/RentalsFilterBar.tsx` — adaugă opțiunea "Întârziate"

- Extind `RentalStatusFilter` cu `"overdue"`.
- Adaug în `Counts` câmpul `overdue`.
- Item nou în dropdown, plasat între `În derulare` și `În așteptare`, cu styling discret de avertizare (`text-amber-700` pe label când count > 0).

### 3. Badge dinamic pe card (în RentalsOutTab, blocul cu `Cerere nouă` / `Confirmată`)

Înlocuiesc switch-ul actual cu `getCardStage(rental)` care întoarce `{ label, tone }`:

| Condiție | Label | Tone |
|---|---|---|
| pending + start_date trecut | `Expirată` | gri |
| pending | `Cerere nouă` | primary pulse |
| overdue (end_date trecut, nereturnat) | `Întârziată` | roșu/amber |
| confirmed, fără handover, start_date = azi | `Predare azi` | primary |
| confirmed, fără handover | `Confirmată` | emerald |
| handover + end_date = azi, fără return | `Returnare azi` | primary |
| handover + nereturnat | `În derulare` | albastru |
| return_confirmed_at | `Finalizată` | emerald subtle |

Toate folosesc `Badge` cu clase semantice existente (fără hex). Înlocuiește `Confirmată` verde mereu-pe.

## Out of scope (nu schimbăm)

- Logica de backend / `get_owner_rentals` RPC — toate informațiile necesare (`start_date`, `end_date`, `handover_confirmed_at`, `return_confirmed_at`, `status`) sunt deja în payload.
- Acțiuni pe carduri (Accept / Refuză / Anulează) — neschimbate.
- Tabul "Anunțuri" / istoricul accordion — neschimbate (folosește același `RentalsFilterBar`, deci primește gratuit bucketul `overdue` în counts).

## Verificare după implementare

- Reîncărcare pagină: `Toate (N)` = suma celorlalte buckete.
- Cele 2 carduri din poză (cu termen trecut) apar acum în `Întârziate` și au badge `Întârziată` roșu/amber pe imagine.
- Filtrare pe `Întârziate` → arată exact acele carduri.
- Filtrare pe `Active` → nu mai conține rezervările cu termen trecut.
