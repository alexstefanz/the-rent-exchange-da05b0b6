## Obiectiv

Adauga un pas explicit de confirmare a primirii produsului de catre chirias dupa semnarea PV de predare. Astazi, dupa ce ambele parti semneaza PV-ul, rezervarea trece automat in `active` (Pasul 5 — Produs predat). Vrem ca acest pas sa devina manual: chiriasul trebuie sa apese „Am primit produsul" pentru a confirma fizic primirea.

## Comportament

1. Ambele parti semneaza PV de predare → status ramane `confirmed`, `handover_confirmed_at` ramane `NULL`.
2. Pe pagina rezervarii apare un card nou „Pasul 5 — Preia produsul":
   - **Chirias**: text „PV-ul a fost semnat de ambele parti. Mergi la {oras} si confirma primirea dupa ce ai produsul in mana." + buton secundar „Vezi PV" + buton primar „Am primit produsul".
   - **Proprietar**: aceeasi sectiune, dar in loc de buton de confirmare: badge „Asteptam chiriasul sa confirme primirea" + buton „Vezi PV".
3. La click pe „Am primit produsul" → confirm dialog → seteaza `handover_confirmed_at = now()` si `status = 'active'`. Realtime updateaza UI-ul ambelor parti.
4. Dupa confirmare, restul fluxului (PV Returnare, early return, etc.) ramane neschimbat.

## Modificari tehnice

**Backend (migration noua):**
- Modifica trigger-ul `tg_pv_handover_progress` astfel incat sa NU mai seteze automat `handover_confirmed_at` si `status='active'` la semnarea ambelor PV-uri. Trigger-ul poate fi sters complet sau redus la no-op (PV-ul semnat ramane in `rental_pv_documents`, dar nu mai promoveaza rental-ul).
- Adauga RPC `confirm_handover_received(_rental_id uuid)`:
  - Verifica `auth.uid() = rentals.renter_id`.
  - Verifica ca exista `rental_pv_documents` cu `phase='handover'` si ambele `owner_signed_at` + `renter_signed_at` non-null.
  - Verifica ca `handover_confirmed_at IS NULL` si `status NOT IN ('cancelled','rejected','completed')`.
  - Seteaza `handover_confirmed_at = now()`, `status = 'active'`.
  - `SECURITY DEFINER`, `search_path = public`.

**Frontend:**
- `src/features/rentals/rentalDetailPageApi.ts`: helper nou `confirmHandoverReceived(rentalId)` care apeleaza RPC-ul.
- `src/pages/RentalDetailPage.tsx`: card nou „Pasul 5 — Preia produsul" afisat cand `handoverDoneEarly && !rental.handover_confirmed_at && rental.status !== 'cancelled'`. Pozitionat sub sectiunea „Procese verbale". Buton „Vezi PV" deschide `setPvOpen('handover')`; buton „Am primit produsul" (doar pentru renter) deschide un mic `AlertDialog` de confirmare → `confirmHandoverReceived` → `refetch`.
- Pentru proprietar: acelasi card, fara butonul de confirmare, cu mesaj „Asteptam chiriasul sa confirme primirea".
- Notificare in-app opcional pentru proprietar la confirmare — **out of scope** pentru acest pas (se poate adauga separat).

**Compatibilitate cu rezervarile existente:**
- Rezervarile cu `handover_confirmed_at` deja setat sau `status='active'` raman neatinse (cardul nu se afiseaza pentru ele).
- Rezervarile in care PV-ul este semnat dar `handover_confirmed_at` e `NULL` vor afisa noul card si vor astepta confirmarea chiriasului.

## Out of scope

- SMS/email la confirmare (se pot adauga ulterior via `notify-rental-event`).
- Schimbari pe `RentalTimeline` (step 5 ramane „Produs predat" si se aprinde tot pe baza `handover_confirmed_at`, ceea ce e deja corect).
