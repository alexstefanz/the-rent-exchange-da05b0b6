## Problem

La apăsarea butonului „Trimite documentele pentru verificare", clientul face:

```sql
UPDATE kyc_cases SET status='SUBMITTED', submitted_at=now() WHERE id=…;
```

Pe `kyc_cases` există **două** triggere BEFORE UPDATE care se contrazic:

1. `enforce_kyc_case_user_immutability` — corect ca intenție: permite tranziții de status între `NOT_STARTED / IN_PROGRESS / SUBMITTED`, dar **blochează orice modificare a `submitted_at` de către user**.
2. `enforce_kyc_cases_user_update` — prea larg: blochează **orice** schimbare de `status` sau alte câmpuri de către non-admini („Not allowed to modify admin-controlled KYC fields").

Rezultat: `UPDATE`-ul din client aruncă excepție → PostgREST returnează eroare → în UI toast-ul de eroare apare foarte scurt/nu este observat, iar cazul rămâne `IN_PROGRESS` cu toate cele 3 documente încărcate.

Confirmat pe cazul real: `alex@advanceonline.co.uk` are `kyc_cases.id=1c3e3670…` `status=IN_PROGRESS` cu 3 documente încărcate la 13:13:58–59.

Același pattern de trigger prea-restrictiv pe care l-am reparat mai devreme pentru `products.deleted_at`.

## Fix (migrație)

1. **DROP** triggerul redundant `trg_enforce_kyc_cases_user_update` (funcția rămâne pentru siguranță; doar detașăm triggerul).
2. **Rescriu** `enforce_kyc_case_user_immutability` pentru a permite user-ului tranziția de submission:
   - Dacă `OLD.status IN ('NOT_STARTED','IN_PROGRESS','REJECTED')` și `NEW.status = 'SUBMITTED'` și `NEW.submitted_at IS NOT NULL` și `OLD.submitted_at IS NULL` → **acceptă** modificarea `submitted_at` (excepție dedicată). 
   - Restul câmpurilor administrative rămân protejate identic.
3. **Data fix**: promovez manual cazul existent (`1c3e3670-d551-4067-b48b-ca7bebd86c3a`) la `status='SUBMITTED', submitted_at=now()` ca admin, ca alex să vadă imediat efectul fără să încarce documentele din nou.

## Ce NU se schimbă

- RLS pe `kyc_cases` (deja permite user updates când `status IN (NOT_STARTED, IN_PROGRESS, REJECTED, SUBMITTED)`).
- Flow-ul UI din `KycInlineFlow.tsx` — nicio schimbare de cod frontend.
- Restricțiile pentru câmpuri gestionate de admin (risk_score, decided_by_admin_id, rejection_reason, etc.).

## Verificare

1. Aplic migrația.
2. Verific în DB că `kyc_cases` pentru alex e SUBMITTED și că notificarea admin apare.
3. Test suplimentar: în UI, dacă utilizatorul reîncarcă documente și apasă „Trimite" din nou, tranziția merge fără eroare.
