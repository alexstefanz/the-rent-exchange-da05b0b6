## 1. Scoate eticheta "privată" de la adresa de ridicare

Fișier: `src/components/publish/PublishWizard.tsx` (Pasul 4, în jur de linia 974–989)

- Înlocuiește label-ul `Adresă ridicare (privată)` cu `Adresă ridicare`.
- Șterge nota cu iconul `Shield`: "Adresa apare doar pentru clienții cu rezervare confirmată. În anunț vizibil e doar orașul." (devine inexactă — adresa apare deja public în card-uri și pe pagina produsului).
- Înlocuiește cu un helper neutru, scurt: "Apare pe pagina anunțului și ajută chiriașii să vadă unde se află produsul."
- Eliminăm și importul `Shield` dacă rămâne nefolosit în fișier.

## 2. Realtime pe tot ce ține de activitate (cereri, plăți, mesaje, aprobări, suport)

Notificările au deja realtime (`useNotifications` ascultă `notifications` INSERT/UPDATE/DELETE), iar tabelele importante sunt deja în publication `supabase_realtime` (`notifications`, `conversations`, `messages`, `rentals`, `rental_pv_documents`, `ops_tickets`, `ops_ticket_messages` etc.). Problema este că majoritatea listelor din UI nu se invalidează când vine un eveniment.

Adăugăm subscriptions ușoare care fac `queryClient.invalidateQueries` pentru cheile relevante. Două nivele:

**a) Hook nou global `useGlobalRealtime(userId)`** (creat în `src/hooks/useGlobalRealtime.ts`), montat o singură dată în `src/App.tsx` (sau în `Navbar`, oriunde e activ pe toate paginile când userul e logat). Ascultă:

- `notifications` INSERT/UPDATE filter `user_id=eq.${userId}` → invalidează `["notifications"]` și `["admin-notifications"]` (deja parțial acoperit, dar îl menținem ca safety net pentru badge-uri).
- `messages` INSERT (fără filter — RLS limitează) → invalidează `["conversations", userId]`, `["unread-messages", userId]`.
- `conversations` UPDATE → invalidează `["conversations", userId]`.
- `rentals` INSERT/UPDATE filter `renter_id=eq.${userId}` și un al doilea channel pentru `owner_id=eq.${userId}` → invalidează `["my-rentals"]`, `["owner-rentals"]`, `["rental", id]`, `["rental-payment-status", id]`, `["account-dashboard"]`, `["earnings"]`, `["wallet-balance"]`.
- `ops_tickets` UPDATE filter `user_id=eq.${userId}` → invalidează `["user-tickets"]`, `["ticket", id]`.
- `ops_ticket_messages` INSERT → invalidează `["ticket-messages", ticket_id]`.

Toate cele de mai sus rulează doar dacă `userId` e definit, cu cleanup pe `removeChannel` la unmount.

**b) Hook nou de pagină `useRentalsListRealtime(userId)`** în `src/pages/RentalsPage.tsx` și `src/pages/RentalsOutPage.tsx`, pentru a invalida lista activă curentă chiar dacă userul nu are global mounting.

Nu sunt necesare migrări — toate tabelele sunt deja în publication.

## 3. Scoate butonul "Regenereaza PDF" din PV-uri

Fișier: `src/components/rentals/PvSignatureDialog.tsx`

- Șterge complet blocul `{pv?.owner_signed_at && pv?.renter_signed_at && (...)}` din liniile ~517–537 (cardul "Regenereaza PDF / Genereaza PDF").
- Șterge handler-ul `handleRegeneratePdf` (liniile ~415–430), state-ul `regenerating` și importul `updatePvPdfPath`/`generatePvPdf` dacă rămân nefolosite.
- Rămâne doar butonul portocaliu "Vezi PV semnat (PDF)" deja prezent (liniile 498–515).
- Generarea PDF rămâne automată la momentul semnării finale — nu o atingem, doar ascundem UI-ul de re-generare manuală.

## Scope explicit

- **In scope:** etichetă adresă, hook global de realtime + cleanup în UI, eliminare buton regenerare PDF.
- **Out of scope:** schimbarea logicii de generare PDF, schimbarea publication-ului realtime, schimbări de RLS, vizibilitate adresă pe pagina produsului (rămâne așa cum este acum).
