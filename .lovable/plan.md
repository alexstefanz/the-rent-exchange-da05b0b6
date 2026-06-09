## Problema

La RNT-000160 chiriasul incarca pozele si semneaza PV-ul de returnare, dar UPDATE-ul cade silentios cu eroarea Postgres:

`Renters can only transition a pending rental to cancelled`

## Cauza

Cand chiriasul semneaza `rental_pv_documents` (faza `return`), trigger-ul AFTER UPDATE `tg_pv_return_progress` executa pe `rentals`:

```sql
UPDATE public.rentals
SET early_return_status = 'initiated'
WHERE id = NEW.rental_id;
```

Functia e `SECURITY DEFINER`, dar `auth.uid()` ramane al chiriasului. Trigger-ul BEFORE UPDATE `lock_renter_rental_update` de pe `rentals` vede atunci un renter care modifica un rental `active` (nu `pending`) si arunca exceptia → toata tranzactia de semnare se face rollback. In UI butonul "Semneaza si trimite clientului" nu produce nimic vizibil.

Acelasi pattern e folosit corect in alte RPC-uri (`confirm_handover_received` etc.) prin flag-ul tranzactional `app.bypass_renter_lock`.

## Fix (migratie)

1. Modific `public.tg_pv_return_progress`:
   - Inainte de fiecare `UPDATE public.rentals ...` setez `PERFORM set_config('app.bypass_renter_lock', 'on', true);` (scoped pe tranzactie).
2. Acelasi tratament pentru `public.tg_pv_handover_progress` daca el atinge `public.rentals` (verificat in migratie, aplicat doar daca e cazul) — pentru a evita acelasi tip de blocaj cand owner-ul actualizeaza si trigger-ul cascade.

Fara modificari de frontend; eticheta butonului si fluxul UI raman. Notificarea catre proprietar (`pv_return_completed_by_party`) era deja apelata din `PvSignatureDialog` dupa semnare — odata ce UPDATE-ul trece, va ajunge la el normal.

## Verificare

- Migratia ruleaza cu succes.
- Reproduc semnatura chiriasului pe RNT-000160 (sau pe un duplicat de test) si confirm:
  - `rental_pv_documents.renter_signed_at` se populeaza.
  - `rentals.early_return_status` devine `initiated`.
  - Notificarea `pv_return_completed_by_party` ajunge la proprietar.
