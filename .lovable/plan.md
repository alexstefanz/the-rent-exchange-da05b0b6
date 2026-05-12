## Banii rămân "Blocat" după finalizare — cauza & fix

### Diagnostic

**RNT-000061**: `status=completed`, `payment_status=authorized`, `completed_at` setat, dar `captured_at=null`. Plata Stripe **nu a fost capturată** — de aceea `useEarnings` o clasifică drept `held` (Blocat).

**RNT-000045**: `status=early_return_requested` — încă așteaptă decizia proprietarului asupra cererii de returnare anticipată. Comportament corect, nu e bug. Va deveni "Disponibil" când e finalizată.

**Cauza tehnică**: Trigger-ul DB `tg_pv_return_progress` (pe `rental_pv_documents`) marchează automat închirierea drept `completed` când proprietarul semnează PV Returnare — **dar nu apelează funcția de captură Stripe**. Singurele locuri care capturează sunt:
- butonul manual `confirmReturn` (necules de fluxul actual bazat pe PV trigger)
- cron-ul `process-rental-captures` (filtrează `end_date <= today`, deci nu prinde închirierile finalizate înainte de termen)

### Fix

#### 1. Trigger DB nou — auto-capture la trecerea în `completed`

Adaug un trigger `AFTER UPDATE ON public.rentals` care, când `status` trece în `'completed'` și `payment_status='authorized'` și `payment_intent_id IS NOT NULL`, apelează prin `pg_net.http_post` funcția edge `capture-rental-payment` cu `{ rental_id }`. Edge function-ul deja acceptă apeluri cu anon key (path-ul folosit de cron) — așa că autentificarea e rezolvată.

```sql
CREATE OR REPLACE FUNCTION public.tg_rental_auto_capture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.payment_status = 'authorized'
     AND NEW.payment_intent_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := '<SUPABASE_URL>/functions/v1/capture-rental-payment',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer <ANON_KEY>'
      ),
      body := jsonb_build_object('rental_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_rental_auto_capture
AFTER UPDATE ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.tg_rental_auto_capture();
```

(URL și anon key sunt setate ca settings în BD sau hardcodate — folosesc valorile reale ale proiectului în migrație.)

#### 2. Backfill RNT-000061

După instalarea trigger-ului, apelez manual `capture-rental-payment` cu `rental_id` corespunzător pentru a captura plata blocată acum și a o muta în "Disponibil".

#### 3. (Eventual) același trigger acoperă și viitor

Orice cale prin care `status` ajunge `completed` (PV trigger, buton manual, decizie early-return acceptată, acțiune admin) va declanșa captura automat, fără a depinde de cron sau de UI.

### Out of scope

- Nu modific RLS, fluxul de PV semnare, sau logica `useEarnings`.
- RNT-000045 nu necesită intervenție — utilizatorul trebuie doar să accepte/respingă cererea de early-return.
- Cron-ul existent `process-rental-captures` rămâne ca fallback pentru închirierile care ajung la `end_date` fără semnare PV.