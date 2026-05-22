## Problemă

În tabul **Contact** din chat, datele de contact (telefon, email) apar imediat ce există orice rezervare plătită istoric între cei doi utilizatori — chiar dacă rezervarea curentă este doar „acceptată" și încă neplătită (ex. RNT-000147, status `confirmed`, `payment_status='pending'`).

Cauza: funcția `get_contact_info_if_in_conversation(owner_uuid)` verifică doar dacă există *vreo* înregistrare în `rentals` între cei doi utilizatori cu `payment_status IN ('authorized','paid','captured','partially_refunded','refunded')`. Nu ține cont dacă rezervarea respectivă mai este activă.

Acelaşi RPC e folosit şi în header-ul ChatPanel (butonul „sună").

## Soluție

Actualizez funcția RPC astfel încât contactul să fie returnat **doar dacă există cel puţin o închiriere activă plătită** între cei doi utilizatori:

- `payment_status` ∈ (`authorized`, `paid`, `captured`, `partially_refunded`)
- `status` ∈ (`confirmed`, `active`, `ongoing`, `in_progress`, `pickup_pending`, `return_pending`) — adică NU `completed`, NU `cancelled`, NU `pending`, NU `rejected`

Astfel:
- Cerere doar acceptată, fără plată → contact ascuns (mesajul „vor fi vizibile după plată" rămâne).
- Plata efectuată şi închirierea în desfăşurare → contact vizibil.
- După `completed`/`cancelled` → contact iar ascuns.

## Implementare

**Migrare unică** care recreează funcţia `public.get_contact_info_if_in_conversation(owner_uuid uuid)` cu noua condiţie (păstrând semnătura, `SECURITY DEFINER`, `STABLE`, `search_path=public`).

Nu sunt modificări de UI necesare:
- `InfoPanel.tsx` deja afișează mesajul „Datele de contact vor fi vizibile după plată" când RPC returnează gol.
- `ChatPanel.tsx` ascunde butonul telefon dacă `ownerPhone` e null.

## Detalii tehnice

```sql
CREATE OR REPLACE FUNCTION public.get_contact_info_if_in_conversation(owner_uuid uuid)
RETURNS TABLE(full_name text, phone text, email text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.full_name, p.phone, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = owner_uuid
    AND (
      auth.uid() = owner_uuid
      OR EXISTS (
        SELECT 1 FROM rentals r
        WHERE ((r.owner_id = owner_uuid AND r.renter_id = auth.uid())
            OR (r.renter_id = owner_uuid AND r.owner_id = auth.uid()))
          AND r.payment_status IN ('authorized','paid','captured','partially_refunded')
          AND r.status IN ('confirmed','active','ongoing','in_progress','pickup_pending','return_pending')
      )
    );
$$;
```

După aprobare voi actualiza şi memoria `gated-contact-flow-v2` cu noua regulă.
