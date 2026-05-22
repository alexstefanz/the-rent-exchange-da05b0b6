# Afișare requester în inbox tickete admin

## Scop
În `/admin/tickets`, fiecare card de ticket din inbox afișează doar `public_id` + titlu. Nu se vede cine a deschis ticketul, deci nu se pot filtra/triajat după user. Adăugăm numele și emailul requesterului direct în listă și extindem căutarea ca să accepte și nume/email.

## Modificări

### 1. `src/features/admin/opsTicketsApi.ts` — `fetchOpsTickets`
- După `select('*')`, fac un al doilea query batch pe `profiles` cu `in('id', requesterIds)` pentru a aduce `full_name` și `email`.
- Populez `requester_name` și `requester_email` pe fiecare ticket (câmpurile există deja pe tipul `OpsTicket`).
- Extind `filters.search`: dacă există un termen, fac OR și pe `public_id`, `title`, dar și pe ID-urile de requester găsite printr-un mic lookup în `profiles` (full_name/email ilike). Implementare simplă: dacă search nu pare a fi un cod TCK, fac lookup în profiluri și adaug `requester_user_id.in.(...)` la query.

### 2. `src/components/admin/tickets/AdminInboxList.tsx`
- Sub titlul ticketului, adaug o linie nouă cu iconul `User` (Lucide) + `t.requester_name ?? t.requester_email ?? "Utilizator anonim"`, truncat la o linie, text muted/xs.
- Actualizez placeholder-ul inputului de căutare: `"TCK-…, titlu sau utilizator"`.
- Filtrul după tab/prioritate/categorie/status rămâne neschimbat.

### 3. Fără modificări de schemă, RLS sau backend.

## Validare
- Verific în preview pe `/admin/tickets` că fiecare card arată numele utilizatorului care a deschis ticketul.
- Testez căutarea după nume parțial și după email.
- Confirm că tichetele „system" (fără requester) afișează fallback-ul fără să spargă layoutul.
