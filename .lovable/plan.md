## Problem

Notificarea "Cererea a fost refuzată" duce la `/search` — rută inexistentă (corectă e `/cauta`), de aceea apare 404. În plus, utilizatorul vrea ca link-ul să ducă la pagina de detaliu a rezervării refuzate (unde se afișează deja motivul refuzului), nu la căutare.

## Fix

### 1. Link nou pentru `request_rejected` (cod)

`supabase/functions/notify-rental-event/index.ts`, în config-ul `request_rejected` (linia 71-78):
- Schimbă `link: () => "/search"` în `link: (c) => "/rezervari/" + c.rental.public_id`.
- Adaugă `smsPurpose: "view_rental"` (consistent cu celelalte event-uri care duc spre detaliu).

`RentalDetailPage` deja afișează un bloc cu titlul "Cerere refuzată" + `rental.rejection_reason` când `status === "rejected"` (sau cancelled cu motiv) — deci nu e nevoie de UI nou.

### 2. Backfill notificări vechi (data)

Update pe `public.notifications`: pentru rândurile existente unde `type='request_rejected'` (sau `title_ro='Cererea a fost refuzată'`) și `link='/search'`, înlocuiește cu link-ul corect către detaliul rezervării. Folosim `description_ro` (conține titlul produsului) doar dacă putem corela; mai sigur: identificăm rental-urile refuzate ale renter-ului prin tabela `rentals` (status `rejected`/`cancelled` cu `rejection_reason`), apoi setăm link-ul la `/rezervari/{public_id}`. Rândurile fără corespondent rămân pe `/cauta` (în loc de `/search`).

### Out of scope

- Fără modificări la flow-ul de email/SMS (folosesc deja `linkPath`-ul corect prin aceeași funcție, deci se rezolvă automat).
- Fără UI nou pe RentalDetailPage — blocul cu motiv există deja.
