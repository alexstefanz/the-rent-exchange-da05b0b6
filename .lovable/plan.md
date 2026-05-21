## Problem

În panoul de chat (tab „Contact" din `InfoPanel`), telefonul și emailul peer-ului apar imediat ce există o conversație. RPC-ul `get_contact_info_if_in_conversation` returnează datele bazându-se DOAR pe existența unei conversații, nu pe o plată efectivă. Conform regulii `gated-contact-flow-v2`, contactul trebuie deblocat doar după plată (booking confirmat).

## Plan

### 1. Migrație DB — restrânge RPC-ul existent

Înlocuiesc `public.get_contact_info_if_in_conversation(owner_uuid)` astfel încât să returneze contactul doar dacă există o închiriere între `auth.uid()` și `owner_uuid` (în orice direcție) cu plata efectuată / autorizată sau cu status avansat:

- `payment_status IN ('authorized', 'paid')`, SAU
- `status IN ('confirmed', 'active', 'completed')`

În plus, `auth.uid() = owner_uuid` rămâne (utilizatorul își vede propriile date).

```sql
CREATE OR REPLACE FUNCTION public.get_contact_info_if_in_conversation(owner_uuid uuid)
RETURNS TABLE(full_name text, phone text, email text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
        AND (
          r.payment_status IN ('authorized','paid')
          OR r.status IN ('confirmed','active','completed')
        )
    )
  );
$$;
```

### 2. UI — `src/components/messaging/InfoPanel.tsx`

Actualizez placeholderul din tab-ul „Contact" la textul cerut:
- RO: „Datele de contact vor fi vizibile după plată."
- EN: „Contact info will be visible after payment."

Restul logicii rămâne (când RPC-ul nu returnează nimic, se afișează placeholderul; după plată, RPC-ul va întoarce telefonul/emailul și se afișează cardurile cu `tel:` / `mailto:`).

### Note

- Nu modific UI-ul altor pagini (cardul de proprietar de pe pagina produs are deja gating-ul corect, conform memoriei).
- Nu ating logica pentru self (utilizatorul își vede întotdeauna datele proprii).
